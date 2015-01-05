### User administration

These commands administer users on a `boss-web` instance and will update your `bossweb` and `bossweb-users` config files.

For the time being `boss-web` must not be running while you do this.

#### Adding users

```sh
bs-web useradd alex
```

#### Removing users

```sh
bs-web rmuser alex
```

#### Resetting passwords

```sh
bs-web passwd alex
```

#### Listing users

```sh
bs-web lsusers
```

#### Changing the password salt

N.b. this will invalidate all user passwords, so don't forget to reset them otherwise no-one will be able to log in!

```sh
bs-web gensalt
```
