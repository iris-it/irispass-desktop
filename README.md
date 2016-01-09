## Grunt Overrider

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

And Voilà !

You can contribute to this project, just fork, update, and submit pull request :)

But i not guarantee the full working of this project ! 