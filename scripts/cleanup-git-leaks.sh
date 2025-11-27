#!/usr/bin/env bash
#
# cleanup-git-leaks.sh
#
# Removes leaked Proxmox token from Git history using BFG Repo Cleaner
#
# WARNING: This script rewrites Git history! It will:
# - Create a backup of the repository
# - Rewrite ALL commits to replace the leaked secret
# - Force-push to remote (overwrites remote history)
# - Update local working repository
# - Delete .gitleaksignore (no longer needed)
#
# Prerequisites:
# - BFG Repo Cleaner installed (brew install bfg)
# - Clean working directory (no uncommitted changes)
# - Valid SSH access to GitHub
#
# Usage:
#   ./scripts/cleanup-git-leaks.sh

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Secret to replace (the leaked Proxmox token)
readonly SECRET_TO_REPLACE="bd2ed89e-6a09-48e8-8a6e-38da9128c8ce"
readonly REPLACEMENT_TEXT="REDACTED-TOKEN-REMOVED"

# Repository information
readonly REPO_NAME="homelab-cli"
readonly BRANCH_NAME="main"
readonly REMOTE_NAME="origin"

# Paths
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly PARENT_DIR="$(cd "${REPO_ROOT}/.." && pwd)"
readonly BACKUP_DIR="${PARENT_DIR}/${REPO_NAME}-backup-$(date +%Y%m%d-%H%M%S)"
readonly MIRROR_DIR="${PARENT_DIR}/${REPO_NAME}-mirror.git"
readonly SECRETS_FILE="${PARENT_DIR}/secrets-to-remove.txt"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
}

log_success() {
    echo -e "${GREEN}✓${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
}

log_error() {
    echo -e "${RED}✗${NC} $*" >&2
}

log_step() {
    echo ""
    echo -e "${BLUE}==>${NC} $*"
}

confirm() {
    local prompt="$1"
    local response

    echo -e "${YELLOW}?${NC} ${prompt} [y/N]: "
    read -r response

    if [[ ! "${response}" =~ ^[Yy]$ ]]; then
        log_error "Operation cancelled by user"
        exit 1
    fi
}

check_command() {
    local cmd="$1"
    if ! command -v "${cmd}" &> /dev/null; then
        log_error "Required command '${cmd}' not found"
        return 1
    fi
}

cleanup_on_error() {
    log_error "Script failed! Cleaning up temporary files..."

    # Remove temporary files if they exist
    [[ -f "${SECRETS_FILE}" ]] && rm -f "${SECRETS_FILE}"
    [[ -d "${MIRROR_DIR}" ]] && rm -rf "${MIRROR_DIR}"

    log_warning "Backup is preserved at: ${BACKUP_DIR}"
    log_info "To restore from backup:"
    log_info "  cd ${REPO_ROOT}"
    log_info "  git fetch --all"
    log_info "  git reset --hard origin/${BRANCH_NAME}"

    exit 1
}

# ============================================================================
# Pre-flight Checks
# ============================================================================

preflight_checks() {
    log_step "Running pre-flight checks..."

    # Check if we're in the right repository
    if [[ ! -d "${REPO_ROOT}/.git" ]]; then
        log_error "Not in a Git repository: ${REPO_ROOT}"
        exit 1
    fi

    # Check if we're in homelab-cli repo
    local repo_name
    repo_name=$(basename "${REPO_ROOT}")
    if [[ "${repo_name}" != "${REPO_NAME}" ]]; then
        log_error "Wrong repository! Expected '${REPO_NAME}', got '${repo_name}'"
        exit 1
    fi

    # Check for required commands
    log_info "Checking required commands..."
    check_command "git" || exit 1
    check_command "bfg" || {
        log_error "BFG Repo Cleaner not found"
        log_info "Install with: brew install bfg"
        exit 1
    }
    check_command "gitleaks" || {
        log_warning "gitleaks not found (optional, but recommended for verification)"
    }

    log_success "All required commands found"

    # Check if working directory is clean
    log_info "Checking working directory..."
    cd "${REPO_ROOT}"

    if [[ -n $(git status --porcelain) ]]; then
        log_error "Working directory has uncommitted changes"
        log_info "Please commit or stash your changes first"
        git status --short
        exit 1
    fi

    log_success "Working directory is clean"

    # Check if we're on the main branch
    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    if [[ "${current_branch}" != "${BRANCH_NAME}" ]]; then
        log_warning "Not on '${BRANCH_NAME}' branch (currently on '${current_branch}')"
        confirm "Continue anyway?"
    fi

    # Check if remote exists and is accessible
    log_info "Checking remote repository..."
    if ! git remote get-url "${REMOTE_NAME}" &> /dev/null; then
        log_error "Remote '${REMOTE_NAME}' not found"
        exit 1
    fi

    local remote_url
    remote_url=$(git remote get-url "${REMOTE_NAME}")
    log_info "Remote: ${remote_url}"

    # Fetch latest from remote
    log_info "Fetching from remote..."
    if ! git fetch "${REMOTE_NAME}"; then
        log_error "Failed to fetch from remote"
        log_info "Please check your network connection and SSH access"
        exit 1
    fi

    log_success "Pre-flight checks passed"
}

# ============================================================================
# Backup
# ============================================================================

create_backup() {
    log_step "Creating backup..."

    if [[ -d "${BACKUP_DIR}" ]]; then
        log_error "Backup directory already exists: ${BACKUP_DIR}"
        exit 1
    fi

    log_info "Copying repository to: ${BACKUP_DIR}"
    cp -r "${REPO_ROOT}" "${BACKUP_DIR}"

    log_success "Backup created successfully"
}

# ============================================================================
# BFG Cleanup
# ============================================================================

run_bfg_cleanup() {
    log_step "Running BFG Repo Cleaner..."

    # Create secrets file
    log_info "Creating secrets replacement file..."
    echo "${SECRET_TO_REPLACE}==>${REPLACEMENT_TEXT}" > "${SECRETS_FILE}"
    log_success "Created: ${SECRETS_FILE}"

    # Create mirror clone
    log_info "Creating mirror clone..."
    if [[ -d "${MIRROR_DIR}" ]]; then
        log_warning "Mirror directory already exists, removing..."
        rm -rf "${MIRROR_DIR}"
    fi

    cd "${PARENT_DIR}"
    git clone --mirror "file://${REPO_ROOT}" "${MIRROR_DIR}"
    log_success "Mirror clone created"

    # Run BFG
    log_info "Running BFG to replace secrets..."
    log_warning "This may take a moment..."

    if bfg --replace-text "${SECRETS_FILE}" "${MIRROR_DIR}"; then
        log_success "BFG completed successfully"
    else
        log_error "BFG failed"
        cleanup_on_error
    fi

    # Run garbage collection
    log_info "Running git garbage collection..."
    cd "${MIRROR_DIR}"
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
    log_success "Garbage collection complete"
}

# ============================================================================
# Verification
# ============================================================================

verify_cleanup() {
    log_step "Verifying secret removal..."

    cd "${MIRROR_DIR}"

    # Search for the secret in history
    log_info "Searching for secret in git history..."
    if git log --all --full-history -S"${SECRET_TO_REPLACE}" | grep -q "${SECRET_TO_REPLACE}"; then
        log_error "Secret still found in git history!"
        cleanup_on_error
    else
        log_success "Secret not found in git history"
    fi

    # Additional check with git grep
    log_info "Double-checking with git grep..."
    if git grep -i "${SECRET_TO_REPLACE}" $(git rev-list --all) 2>/dev/null | grep -q "${SECRET_TO_REPLACE}"; then
        log_error "Secret still found with git grep!"
        cleanup_on_error
    else
        log_success "Secret confirmed removed"
    fi
}

# ============================================================================
# Push to Remote
# ============================================================================

push_to_remote() {
    log_step "Pushing cleaned history to remote..."

    log_warning "This will FORCE PUSH to remote and rewrite history!"
    log_warning "Remote: $(git -C "${REPO_ROOT}" remote get-url "${REMOTE_NAME}")"
    log_warning "Branch: ${BRANCH_NAME}"

    confirm "Are you ABSOLUTELY SURE you want to continue?"

    cd "${MIRROR_DIR}"

    log_info "Force pushing to ${REMOTE_NAME}..."
    if git push --force; then
        log_success "Successfully pushed to remote"
    else
        log_error "Failed to push to remote"
        log_warning "Your backup is safe at: ${BACKUP_DIR}"
        cleanup_on_error
    fi
}

# ============================================================================
# Update Local Repository
# ============================================================================

update_local_repo() {
    log_step "Updating local repository..."

    cd "${REPO_ROOT}"

    log_info "Fetching updated history from remote..."
    git fetch "${REMOTE_NAME}"

    log_info "Resetting local branch to remote..."
    git reset --hard "${REMOTE_NAME}/${BRANCH_NAME}"

    log_info "Cleaning up local refs..."
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive

    log_success "Local repository updated"
}

# ============================================================================
# Final Cleanup
# ============================================================================

final_cleanup() {
    log_step "Cleaning up temporary files..."

    # Remove mirror repo
    if [[ -d "${MIRROR_DIR}" ]]; then
        log_info "Removing mirror repository..."
        rm -rf "${MIRROR_DIR}"
        log_success "Mirror removed"
    fi

    # Remove secrets file
    if [[ -f "${SECRETS_FILE}" ]]; then
        log_info "Removing secrets file..."
        rm -f "${SECRETS_FILE}"
        log_success "Secrets file removed"
    fi

    # Remove .gitleaksignore (no longer needed)
    cd "${REPO_ROOT}"
    if [[ -f ".gitleaksignore" ]]; then
        log_info "Removing .gitleaksignore (no longer needed)..."
        rm -f ".gitleaksignore"
        git add .gitleaksignore
        git commit -m "chore: remove .gitleaksignore after history cleanup"
        git push "${REMOTE_NAME}" "${BRANCH_NAME}"
        log_success ".gitleaksignore removed"
    fi
}

# ============================================================================
# Final Verification
# ============================================================================

final_verification() {
    log_step "Running final verification..."

    cd "${REPO_ROOT}"

    # Run gitleaks if available
    if command -v gitleaks &> /dev/null; then
        log_info "Running gitleaks scan..."
        if gitleaks git -v; then
            log_success "Gitleaks scan passed - no secrets found!"
        else
            log_error "Gitleaks found potential issues"
            log_warning "Please review the output above"
        fi
    else
        log_warning "Skipping gitleaks scan (not installed)"
    fi

    # Check for BFG report
    if [[ -f "${REPO_ROOT}.bfg-report" ]]; then
        log_info "BFG report available at: ${REPO_ROOT}.bfg-report"
    fi
}

# ============================================================================
# Main
# ============================================================================

main() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║          Git History Cleanup - Remove Leaked Secrets          ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""

    log_warning "This script will rewrite Git history!"
    log_info "Repository: ${REPO_ROOT}"
    log_info "Backup will be created at: ${BACKUP_DIR}"
    echo ""

    confirm "Do you want to continue?"

    # Set up error trap
    trap cleanup_on_error ERR

    # Execute steps
    preflight_checks
    create_backup
    run_bfg_cleanup
    verify_cleanup
    push_to_remote
    update_local_repo
    final_cleanup
    final_verification

    # Success!
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║                    ✓ CLEANUP SUCCESSFUL!                      ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    log_success "Git history has been cleaned"
    log_success "Secret '${SECRET_TO_REPLACE}' has been removed from all commits"
    log_success "Remote repository has been updated"
    echo ""
    log_info "Backup location: ${BACKUP_DIR}"
    log_info "You can safely delete the backup after verification:"
    log_info "  rm -rf ${BACKUP_DIR}"
    echo ""
    log_warning "IMPORTANT: Anyone who has cloned this repository must:"
    log_warning "  1. Delete their local clone"
    log_warning "  2. Clone fresh from GitHub"
    echo ""
}

# Run main function
main "$@"
