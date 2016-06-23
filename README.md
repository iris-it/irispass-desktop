## IrisPass Desktop

Os Js est la plateforme web pour faire du bureau virtuel
Codé en js avec node.js, le code est relativement simple a comprendre

La doc est dispo a cette adresse [Doc OS.JS](http://os.js.org/doc/)
Elle est séparée en deux partie :
- Client API
- Server API

Le client est pour le desktop principalement, avec tout le code pour le style, les apps, la gestion de l'os en lui même

Pour le serveur c'est un peu plus différent, à ce moment il ne sert qu'à deux choses, l'auth et le VFS ( virtual file system )

Le VFS permet d'interagir avec des fichiers, depuis le client, mais lui seul ne peux pas, c'est pour ça que coté api on peux le faire avec nodejs du coup, au lieu de faire comme en php un scandir bah on appelle l'api etc etc

La doc est complète et le must c'est d'aller ici et de poser les questions a Anders (createur d'os.js et plutôt vraiment sympa !!!!) [Lien du chat](https://gitter.im/andersevenrud/OS.js-v2)

![alt tag](http://replygif.net/i/1353.gif)

hop hop hop plus rien à faire ici, let's code !

## Install
Cloner ce repository

- `git clone https://github.com/iris-it/irispass-desktop.git`

dans le repertoire tout juste cloné lancer ces commandes :
```
#initialize and get dependencies
git pull && git submodule init && git submodule update && git submodule status

# We get the latest updates from os.js
git submodule foreach git pull origin master

# install the dependencies of the project
npm install

# make the override from the project to os.js
grunt build

# no comment
cd osjs

# install the dependencies of os.js
npm install
npm install node-mysql bcryptjs node-rest-client
git clone https://github.com/gildas-lormeau/zip.js.git vendor/zip.js

# build os.js
grunt

./bin/start-dev.sh #on linux
./bin/win-start-dev.cmd #on windows
```

Mais cela ne suffira pas !

Il faut initialiser l'api et la rendre disponible

Faites donc pointer un apache sur le repertoire public qui est dans `app/public`

enfin ajustez les paramètres dans le .env du dossier app

Migrez la base de données avec `php artisan migrate` dans le repertoire app

Puis si vous avez keycloak ( obligatoire ) configurez le .env avec les bonnes données

Ah et oui n'oubliez pas les public.key et private.key dans le dossier storage !

Ces clés vont permettre de valider les JWT en provenance de os.js et de toute autre application :)

et se rendre sur [cette page](http://localhost:8000)

And Voilà !

You can contribute to this project, just fork, update, and submit pull request :)

But i not guarantee the full working of this project !
