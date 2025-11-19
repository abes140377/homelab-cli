# Start Zellij with Layout

/openspec:proposal Implement a project zellij command to start Zellij with a predefined layout.
I want to create a new oclif command that allows starting Zellij with a predefined layout. This should make it easy for users to quickly load their preferred terminal work environments.
Create a new oclif command: `project zellij <module-name> <config-name>`
The command accepts the module name (`<module-name>`) as an argument.
The command accepts the layout name (`<config-name>`) as an argument.
The command should then run:
  `zellij -n <path-to-current-project>/.config/zellij/<module-name><config-name>-layout.kdl`
`<path-to-current-project>` must be the absolute path of the current project. Existing code `detectCurrentProject(process.cwd(), config.projectsDir)` can be used to determine this.
`<module-name>` is optional. If omitted, determine the module name as the basename of the directory where the command is executed. Example: if the current directory is `/home/itag001202/projects/cas/src/tools/cas-cli` and you run `project zellij start`, `<module-name>` should be `cas-cli`.
`<config-name>` is optional. If omitted, use `"default"`.
The command must print an error if the resulting file path
`<path-to-current-project>/.config/zellij/<module-name><config-name>-layout.kdl`
does not exist.
On error, output the full file path so the user knows which file is missing.
