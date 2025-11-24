<!-- openspec:proposal Listing proxmox vms in the cli
ich möchte eine funktion in der homelab-cli implementieren, die es ermöglicht, proxmox vms aufzulisten.
die funktion soll analog zum 'proxmox template list' befehl implementiert werden. die ausgabe soll tabellarisch sein und die folgenden spalten enthalten:
- vmid
- name
- status
- ipv4 address

/openspec:proposal Implement Workspace start oclif command
I want to implement an oclif command in homelab-cli that allows starting a workspace.
The command should be called 'workspace start <workspace-name> <flag>'.
The workspace should support the following flags:
- vscode: starts the workspace with the context in vscode by calling 'code ~/projects/<workspace-name>/<context-name>.code-workspace'
- terminal: opens the workspace directory in the terminal by calling 'cd ~/projects/<workspace-home>'
The command should load the available workspaces from the poketbase collection 'workspaces'.
The 'workspaces' collection has been extended with a relation 'contexts', which contains the available contexts for the workspace.
In the 'contexts' collection, the attribute 'name' is available for the context name. -->

remove src/repositories/workspace.repository.ts
rename src/repositories/pocketbase-workspace.repository.ts to src/repositories/workspace.repository.ts
verify that the workspace repository is used in the command implementation
run all tests related to the workspace repository to ensure everything works correctly after the rename

remove test/commands/workspace/list.test.ts
rename test/commands/workspace/list-pocketbase.test.ts to test/commands/workspace/list.test.ts
verify that all tests related to the workspace list command are working correctly after the rename

remove the src/commands/workspace/list-pocketbase.ts file i want to use src/commands/workspace/list.ts as the command for listing workspaces

/openspec:proposal Implement project list command
I want to implement an oclif command in homelab-cli that allows listing projects.
a project is a new entity with the following attributes:
- name: string
- description: string
- gitRepoUrl: string
a project is associated with a workspace where a workspace can have multiple projects and a project belongs to one workspace.
the cli should support the following commands:
- project list <workspace-name>: lists all available projects for a specific workspace
- project list: lists all available projects for the current workspace where the current workspace should be determined by the cureent working directory basename where the cli is executed from.
  e.g. if the cli is executed from ~/projects/sflab, the current workspace is 'sflab'.
The commands should load the available projects from the poketbase collection 'projects'.
The output should be tabular and contain the following columns:
- name
- description
- gitRepoUrl

/openspec:proposal Workspace shell command
I want to implement an oclif command in homelab-cli that allows opening a shell in the directory of a workspace.
The directory would be ~/projects/<workspace-name>.
command should look like: workspace shell <workspace-name> <layout-name>
after opening the shell, in the workspace directory at ~/projects/<workspace-name>,
i want to execute the following command in the terminal to start zellij with the specified layout and a session name:
zellij -n .config/zellij/<layout-name>-layout.kdl -s <workspace-name>
the available workspaces should be loaded from the poketbase collection 'workspaces'.
the available layouts should be loaded from the workspace directory at ~/.config/zellij/.
for every layout file found in the directory, a layout name should be derived by removing the '-layout.kdl' suffix from the filename.

führe ein refactoring für meinen project oclif command durch.
ich möchte den command 'project' in 'module' umbenennen.
ändere die command klassen unter src/commands/project/ in src/commands/module/
passe dateinamen entsprechend dem neuen command namen.
alle klassen die vom command genutzt werden sollen ebenfalls angepasst werden.
suche alle referenzen im code und passe diese entsprechend an.
passe auch die test dateien an.

führe ein refactoring für meinen workspace oclif command durch.
ich möchte den command 'workspace' in 'project' umbenennen.
ändere die command klassen unter src/commands/workspace/ in src/commands/project/
passe dateinamen entsprechend dem neuen command namen.
alle klassen die vom command genutzt werden sollen ebenfalls angepasst werden.
suche alle referenzen im code und passe diese entsprechend an.
passe auch die test dateien an.

ich möchte eine alternative implementieren für meine src/repositories/project.repository.ts datei.
die neue implementierung soll das dateisystem nutzen um die projekts aufzulisten anstatt pocketbase.
es sollen all verzeichnisse aufgelistet werden die sich unter ~/projects/ befinden.
da es sich dabei nicht um den zugriff auf pocketbase handelt, soll die neue implementierung in src/repositories/project-fs.repository.ts liegen.
is das repository pattern für diesen zweck der richtige ansatz?

ich möchte das neue project-fs repository in meinem project list command nutzen.
erstelle dazu eine neue service klasse unter src/services/project-fs.service.ts die das project-fs repository nutzt um die projekte zu laden.
passe den project list command an um die neue service klasse zu nutzen.
lass die bestehende implementierung mit pocketbase bestehen, damit ich später zwischen den beiden implementierungen wechseln kann.

erstelle jetzt ein neues dto ProjectFsDto für die projekts und verwende das dto in der project-fs repository implementierung.
das neue dto soll die attribute name und gitRepoUrl enthalten.
das attribute name soll den wert des verzeichnisnamens enthalten.
das attribute gitRepoUrl soll über das kommando git remote get-url origin im jeweiligen projekt verzeichnis ermittelt werden.
benutze das neu dto in der project-fs repository implementierung.
passe die ausgabe im project list command entsprechend an, damit nur noch name und gitRepoUrl angezeigt werden.

entferne den module list command.
entferne auch alle weiteren dateien die nur für den module command genutzt wurden.

/openspec:proposal Implement 'project module list <project-name>' command
I want to implement an oclif command in homelab-cli that allows listing modules for a specific project.
The command should be called 'project module list <project-name>'.
The command should load the available modules from the filesystem.
A module is represented by a directory under the project directory located at ~/projects/<project-name>/src
A module ist a directory that is a git repository (contains a .git folder).
Make the <project-name> argument optional. If no project name is provided, the command should determine the current project by using the current working directory basename where the cli is executed from.
as a example use this logic to determine the current project:
Example 1:
path: ~/projects/sflab/src/homelab-cli
current project: sflab
Example 2:
path: ~/projects/myproject/src/some-module
current project: myproject

entferne den 'project vscode' command.
entferne auch alle weiteren dateien die nur für den 'project vscode' command genutzt wurden.



/openspec:proposal Implement 'project vscode <project-name> <workspace-name>' command
I want to implement an oclif command in homelab-cli that allows opening a vscode workspace for a specific project.
The command should be called 'project vscode <project-name> <workspace-name>'.
The command should open the vscode workspace located at ~/projects/<project-name>/<workspace-name>.code-workspace by calling 'code ~/projects/<project-name>/<workspace-name>.code-workspace'.
The <project-name> argument should be optional. If no project name is provided, the command should determine the current project by using the current working directory basename where the cli is executed from.
as a example use this logic to determine the current project:
Example 1:
path: ~/projects/sflab/src/homelab-cli
current project: sflab
Example 2:
path: ~/projects/myproject/src/some-module
current project: myproject
the workspace name should also be optional. if no workspace name is provided, the command to start vscode should open vscode with the command 'code .' in the project directory.
take a look at my existing repositories and services for functionalities that already exists and can be reused for this command.
if you have to make changes to the existing repositories or services, make sure to not break existing functionalities.

ich habe ein refactoring für meinen code durchgeführt.
ich glaube dass meine änderungen dazu führen dass pocketbase nicht mehr benötigt wird.
überprüfe meinen code und finde alle stellen an denen pocketbase noch genutzt wird.
erstelle eine übersicht mit allen stellen an denen pocketbase noch genutzt wird und schlage vor wie ich pocketbase entfernen kann.
entferne auch die pocketbase npm pakete aus der package.json datei.
zeig mir die übersicht und frage mich nach bestätigung bevor du pocketbase entfernst.

passe den plan an. ich möchte folgenden dateien behalten:
- .mise/tasks/pocketbase/serve
- .creds.env.yaml

/openspec:proposal Listing proxmox vms in the cli
ich möchte eine funktion in der homelab-cli implementieren, die es ermöglicht, proxmox vms aufzulisten.
es sollen nur vm's aufgelistet werden die keine templates sind.
die funktion soll analog zum 'proxmox template list' befehl implementiert werden. die ausgabe soll tabellarisch sein und die folgenden spalten enthalten:
- vmid
- name
- status
- ipv4 address

remove the following files and their test files:
- src/repositories/project.repository.ts
- src/services/project.service.ts
update my code to remove any references to the removed files
run all tests to ensure everything works correctly after the removal

/openspec:proposal Listing proxmox lxc containers in the cli
ich möchte einen command 'proxmox vm list' in der homelab-cli implementieren, die es ermöglicht, proxmox lxc container aufzulisten.
es sollen nur vm's aufgelistet werden die den type 'lxc' haben.
die funktion soll analog zum 'proxmox vm list' befehl implementiert werden. die ausgabe soll tabellarisch sein und die folgenden spalten enthalten:
- vmid
- name
- status
- ipv4 address
es soll die bestehende funktionalität zum listen von proxmox vms erweitert werden, damit sowohl vms als auch lxc container gelistet werden können.
führe ein refactoring für meinen proxmox-api repository durch.
die bestehende funktion listVMs soll in listResources umbenannt werden.
die neue funktion listResources soll einen parameter resourceType vom typ 'qemu' | 'lxc' akzeptieren.
basierend auf dem resourceType parameter soll die funktion entweder vms oder lxc container listen.
passe die implementierung entsprechend an, damit nur die ressourcen des angegebenen typs zurückgegeben werden.
passe auch die tests für den proxmox-api repository an, damit die neuen änderungen abgedeckt sind.

/openspec:proposal Implement 'proxmox container list' oclif command
die funktion soll analog zum 'proxmox vm list' befehl implementiert werden. die ausgabe soll tabellarisch sein und die folgenden spalten enthalten:
- vmid
- name
- status
- ipv4 address
es soll die bestehende listResources funktion im proxmox-api repository genutzt werden, um die lxc container zu laden.

/openspec:proposal Implement 'proxmox vm create' oclif command
ich möchte einen command 'proxmox vm create <vm-name> <template-name>' in der homelab-cli implementieren, die es ermöglicht, proxmox vms von einer template
zu erstellen. zum erstellen der vm soll das proxmox-api npm package genutzt werden.
der command soll die folgenden parameter akzeptieren:
- vm-name: der name der neuen vm
- template-name: der name der template von der die vm erstellt werden soll

/openspec:proposal Implement 'proxmox vm cloudinit' oclif command
I want to implement a command 'proxmox vm cloudinit <vmid>' in the homelab-cli that allows setting cloud-init values for a proxmox vm.
The proxmox-api npm package should be used to set the cloud-init values.
The command should accept the following parameters:
- user: the username for the default user in the vm (default: 'admin')
- password: the password for the default user in the vm (default: '')
- SSH public key: the content of the ssh public key for the default user in the vm (default content from: './keys/admin_id_ecdsa.pub')
- upgrade: whether the vm should be automatically upgraded on first boot (default: false)
- IP Config (eth0): the IPv4 configuration for the eth0 interface in the vm (default: 'dhcp')
  Should allow Static IP addresses in CIDR notation, gateways are optional but need an IP of the same type specified.
  format examples:
    - dhcp
    - ip=192.168.1.100/24
    - ip=10.0.10.123/24,gw=10.0.10.1
Configuring ipv6 is not required at this time because it is not used in my homelab.


/openspec:proposal Integrate execa for Simpler Command Execution
Integrate the execa npm package into homelab-cli to simplify executing shell commands.
Create a new service class at src/services/command-executor.service.ts that uses execa to run shell commands.
The service class should provide a method executeCommand that accepts a shell command as a string and executes it.
An optional parameter should accept arguments as an array of strings.
Another optional parameter should accept the working directory as a string.
The method should print the command output to the terminal and stream output in real time for long-running processes.
Create a concept to standardize and make prompts consistent across the CLI and implement this concept in a new 'exec demo' command.
Make the command execution generic and configurable so they can be adapted for different purposes.
Create a new oclif command 'exec demo' that demonstrates various executions.
do not modify existing commands to use the new service yet; this will be done in a later step.

/openspec:proposal Integrate enquirer for my cli prompts
I want to use the npm package enquirer for prompts in my homelab-cli.
Create a new oclif command 'prompt demo' that demonstrates various prompts with enquirer.
The command should include the following prompts:
- Text input: ask the user for their name
- Password input: ask the user for their password
- Select input: allow the user to choose an option from a list of options (options: 'option 1', 'option 2', 'option 3')
- Multi-select input: allow the user to select multiple options from a list of options (options: 'option A', 'option B', 'option C')
Create a concept to standardize and make prompts consistent across the CLI and implement this concept in the 'prompt demo' command.
Create a clean separation between the command and the prompts so the prompts can later be reused for other commands.
Make the prompts generic and configurable so they can be adapted for different purposes.
Allow passing default values for the prompts that can be used as presets.
Allow passing options for prompts, e.g. the options for a select list or a multi-select list.

/openspec:proposal Implement 'project zellij <project-name> <config-name>' command
I want to implement an oclif command in homelab-cli that allows opening a zellij session for a specific project with a specific configuration.
The command should be called 'project zellij <project-name> <config-name>'.
The command should open the zellij session by calling 'zellij -n ~/projects/<project-name>/.config/zellij/<config-name>.kdl -s <config-name>'.
The <project-name> argument should be optional. If no project name is provided, the command should determine the current project by using the current working directory basename where the cli is executed from.
as a example use this logic to determine the current project:
Example 1:
path: ~/projects/sflab/src/homelab-cli
current project: sflab
Example 2:
path: ~/projects/myproject/src/some-module
current project: myproject
the <config-name> should also be optional. if no <config-name> is provided, the <config-name> should be determined by the basename of the current working directory.
e.g. if the cli is executed from ~/projects/sflab/src/homelab-cli, the <config-name> should be 'homelab-cli'.
take a look at my existing repositories and services for functionalities that already exists and can be reused for this command.
if you have to make changes to the existing repositories or services, make sure to not break existing functionalities.

---

/openspec:proposal Integrate ConfigStore npm package for Persistent Configuration Management
To enhance the user experience and streamline configuration management, we propose integrating the ConfigStore npm package into the homelab-cli project.
ConfigStore should be able to persistently store and retrieve configuration data, eliminating the need to repeatedly manage environment variables or configuration files manually.
To achieve this, the existing config implementations in `src/config` should be adapted.
By default, configuration values should be read from the ConfigStore instance. The configuration values should remain overridable via environment variables to ensure flexibility.
Create a a prove of concept with the following requirements:
- create a new config class named `CliConfig` in `src/config/cli.config.ts` that utilizes the ConfigStore package for storing configuration values.
- Create a new oclif command 'config read' that demonstrates reading configuration values from the `CliConfig` class.
- Create a new oclif command 'config write' that demonstrates writing configuration values to the `CliConfig` class and the underlying ConfigStore instance and their config file.
- Ensure that the `CliConfig` class allows for environment variable overrides for configuration values.

---

erweitere den oclif command `project zellij`
führe `bin/dev.js project zellij homelab-cli` aus und schau dir die meldung an.
der hinweis der kommt ist korrekt. die zu startende session läuft bereits.
ich möchte den command so ändern dass er prüft ob eine session mit dem namen bereits vorhanden ist.
wenn eine session bereits vorhanden ist soll das folgende zellij kommando ausgeführt werden: zellij attach homelab-cli
wenn die session noch nicht besteht soll die session gestartet werden wie es in der aktuellen implementierung vorhanden ist.

---

schau dir meine gesamt codebase an. ich möchte die bestehende implementierung für die ausführung von kommandos auf die ausführung mit execa und der neuen CommandExecutorService klasse umstellen.
erstelle einen plan un schau ob die bestehenden implementierungen durch den aufruf der executeCommand funktion in der klasse ersetzt werden kann.

---

führe die folgenden refactorings aus:
rename src/repositories/module-fs.repository.ts to src/repositories/module.repository.ts, rename class in file from ModuleFsRepository to ModuleRepository
rename src/repositories/project-fs.repository.ts to src/repositories/project.repository.ts, rename class in file from ProjectFsRepository to ProjectRepository
rename src/services/module-fs.service.ts to src/services/module.service.ts, rename class in file from ModuleFsService to ModuleService
rename src/services/project-fs.service.ts to src/services/project.service.ts, rename class in file from ProjectFsService to ProjectService
rename src/models/module-fs.dto.ts to src/models/module.dto.ts, rename ModuleFsDto in file to ModuleDto
rename src/models/project-fs.dto.ts to src/models/project.dto.ts, rename ProjectFsDto in file to ProjectDto

---

überarbeite meinen oclif command in `src/commands/module/list.ts`.
der command soll alle module für ein projekt auflisten im ´src´ verzeichnis auch rekursiv.
passe die listModules funktion in der module.service.ts an, damit diese rekursiv alle module im ´src´ verzeichnis findet.

---

überarbeite meinen oclif command in `src/commands/project/zellij.ts`.
ergänze ein argument 'module-name', welches nicht optional ist.
das argument 'config-name' soll optional sein. wenn es nicht angegeben wird soll default als wert genutzt werden.
ich möchte dann das folgende zellij kommando ausführen:
zellij -n ~/projects/<project-name>/.config/zellij/<module-name>/<config-name>.kdl -s <module-name>-<config-name>

überarbeite meinen oclif command in `src/commands/project/zellij.ts`.
entferne das argument 'project-name'. es soll immer detectCurrentProject genutzt werden um das aktuelle projekt zu ermitteln.

überarbeite meinen oclif command in `src/commands/project/zellij.ts`.
verschiebe den command direkt in das `src/commands` dass ich ihn mit `bin/dev.js zellij <module-name> <config-name>` ausführen kann.

überarbeite mein oclif command in `src/commands/project/vscode.ts`.
verschiebe den command direkt in das `src/commands` dass ich ihn mit `bin/dev.js vscode ` ausführen kann.
entferne den parameter 'project-name' und nutze immer detectCurrentProject um das aktuelle projekt zu ermitteln.

überarbeite meinen oclif command in `src/commands/zellij.ts`.
mach den parameter 'config-name' optional. wenn kein wert angegeben wird soll ein promt angezeigt werden der die verfügbaren konfigurationen im verzeichnis `~/projects/<project-name>/.config/zellij/` auflistet.
alle verzeichnisse in dem pfad entsprechen einer auswahl.
beispiel:
~/projects/<project-name>/.config/zellij/cli
~/projects/<project-name>/.config/zellij/ansible
auswahl: cli, ansible
benutze promptForSelection aus `src/utils/prompts.ts` um die auswahl zu implementieren.

wenn ich `bin/dev.js zellij` ausführe kommt der fehler:
Error: Missing 1 required arg:
module-name  Name of the module

ich sehe jetzt den prompt mit der auswahl. aber die liste stimmt nicht. ich sehe folgende auswahlmöglichgkeiten:
ansible/ansible-role-adguardhome
ansible/ansible-role-bind9
ansible/homelab-dns-ansible-playbook
ansible/homelab-pki-ansible-playbook
homelab-cli
homelab-daggerverse
homelab-docker-compose/nautobot-docker-compose
homelab-docker-compose/netbox-docker-compose
homelab-packer-templates
terragrunt/examples/terragrunt-infrastructure-catalog-example
terragrunt/examples/terragrunt-infrastructure-live-stacks-example
terragrunt/terragrunt-infrastructure-catalog-homelab
terragrunt/terragrunt-infrastructure-live-stacks-homelab

ich würde aber erwarten dass ich die folgende auswahl sehe:
ansible
cli

die auswahl soll die verzeichnisse unter `~/projects/<project-name>/.config/zellij` anzeigen.

---

refactore den oclif command in `src/commands/zellij.ts`.
ändere das argument 'config-name' in ein flag '--layout-name' bzw. '-l' um.
das flag soll optional sein. ich möchte das flag so verwenden können: `bin/dev.js zellij --layout-name default` oder `bin/dev.js zellij -l default`
wenn das flag nicht angegeben wird soll der wert auf 'default' gesetzt werden.

---

schau dir meinen oclif command in `src/commands/proxmox/vm/list.ts` an.
er unterstützt das --json flag.
füge die unterstützung für das --json falg auch in den folgenden commands hinzu:
- src/commands/proxmox/vm/create.ts
- src/commands/proxmox/template/list.ts
- src/commands/proxmox/container/list.ts
- src/commands/project/list.ts
- src/commands/module/list.ts
