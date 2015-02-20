# Upgrading

## 2.x.x to 3.x.x

 1. Stop boss and uninstall

        $ sudo bs kill
        $ sudo npm remove -g process-boss

 2. Rename your configuration files and directories (all .key .json etc files should come too):
    * `/etc/boss` becomes `/etc/guvnor`
    * `/etc/boss/bossrc` becomes `/etc/guvnor/guvnorrc`
    * `~/.config/boss/bossweb` becomes `~/.config/guvnor/guvnor-web`
    * `~/.config/boss/bossweb-hosts` becomes `~/.config/guvnor/guvnor-web-hosts`
    * `~/.config/boss/bossweb-users` becomes `~/.config/guvnor/guvnor-web-users`
 3. Rename run/log/app directories
    * `/var/log/boss` becomes `/var/log/guvnor`
    * `/var/run/boss` becomes `/var/run/guvnor`
    * `/usr/local/boss` becomes `/usr/local/guvnor`
 4. Install guvnor and start

        $ sudo npm install -g guvnor
        $ sudo guv
