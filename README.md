## IrisPass Os.Js

Os Js est la plateforme web pour faire du bureau virtuel
Codé en js avec node.js, le code est relativement simple a comprendre

La doc est dispo a cette adresse [Doc OS.JS](http://os.js.org/doc/)
Elle est séparée en deux partie :
- Client API
- Server API

Le client est pour le desktop principalement, avec tout le code pour le style, les apps, la gestion de l'os en lui même

Pour le serveur c'est un peu plus différent, à ce moment il ne sert qu'à deux choses, l'auth et le VFS ( virtual file system )

Le VFS permet d'interagir avec des fichiers, depuis le client, mais lui seul ne peux pas, c'est pour ça que coté api on peux le faire avec nodejs du coup, au lieu de faire comme en php un scandir bah on appelle l'api etc etc

La doc est complète et le must c'est d'aller ici et de poser les questions a Anders (createur d'os.js et plutôt sympa) [Lien du chat](https://gitter.im/andersevenrud/OS.js-v2)

![alt tag](http://replygif.net/i/1353.gif)

hop hop hop plus rien à faire ici, let's code !

## Install
Cloner Os.Js dans un dossier pour avoir la base du code

`git clone https://github.com/andersevenrud/OS.js-v2.git`

dans le repertoire d'OS.js-v2 lancer ces commandes :
`npm install `
`npm install node-mysql bcryptjs`
`npm install -g supervisor`
`.\bin\create-windows-symlinks.cmd`
`grunt watch` et laisser tourner la commande
`.\bin\win-start-dev.cmd` a lancer dans un autre terminal pour lancer le serveur nodejs

Cloner ce repository

`git clone https://github.com/Bouhnosaure/IrisPass-OsJs.git`

Modifier le fichier conf.json pour que l'attribut project, corresponde au chemin vers le repertoire d'oj.js
lancer ces commandes :
`npm install`
`grunt watch` à laisser tourner


Pour de la simple edition de theme sans code js (api / server) modifier ce fichier
`.\override\src\conf\900-custom.json`
passer de `mysql` à `demo`


et se rendre sur [cette page](http://localhost:8000)

## Develop and push changes

In coming !

## Overrider
This project was created in order to override projects witout touching sources manually

So if you need to keep the source you've modified in a directory use this project

For instance, you need to modify or adapt an opensource project but you wont make a fork because the project is update everyday,
just fork this project, update the conf.json to make the "project" attribute matching you root project like /var/www/mycoolproject
create the tree for your file like so :

```
The project which needs modifications
└── src
    ├── AnotherFile.php
    └── aSubdir
        └── AnotherFile.html
```

If you need to update AnotherFile.html, create the tree and copy the file.

```
└── override ( this dir is in the project )
    └── src
        └── subdir
            └── AnotherFile.html
```

after, launch `grunt copy`

or `grunt watch` if you are brave enough

And Voilà !

You can contribute to this project, just fork, update, and submit pull request :)

But i not guarantee the full working of this project !