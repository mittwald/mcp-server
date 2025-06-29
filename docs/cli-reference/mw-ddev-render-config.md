# mw ddev render-config

```
$ mw ddev render-config --help
Generate a DDEV configuration YAML file for the current app.

USAGE
  $ mw ddev render-config [INSTALLATION-ID] [--override-type
    backdrop|craftcms|django4|drupal6|drupal7|drupal|laravel|magento|magento2|ph
    p|python|shopware6|silverstripe|typo3|wordpress|auto] [--without-database |
    --database-id <value>]

ARGUMENTS
  INSTALLATION-ID  ID or short ID of an app installation; this argument is
                   optional if a default app installation is set in the context.

FLAGS
  --database-id=<value>     ID of the application database
  --override-type=<option>  [default: auto] Override the type of the generated
                            DDEV configuration
                            <options: backdrop|craftcms|django4|drupal6|drupal7|
                            drupal|laravel|magento|magento2|php|python|shopware6
                            |silverstripe|typo3|wordpress|auto>
  --without-database        Create a DDEV project without a database

DESCRIPTION
  Generate a DDEV configuration YAML file for the current app.

  This command initializes a new ddev configuration in the current directory.

FLAG DESCRIPTIONS
  --database-id=<value>  ID of the application database

    The ID of the database to use for the DDEV project; if set to 'auto', the
    command will use the database linked to the app installation.

    Setting a database ID (either automatically or manually) is required. To
    create a DDEV project without a database, set the --without-database flag.

  --override-type=backdrop|craftcms|django4|drupal6|drupal7|drupal|laravel|magento|magento2|php|python|shopware6|silverstripe|typo3|wordpress|auto

    Override the type of the generated DDEV configuration

    The type of the generated DDEV configuration; this can be any of the
    documented DDEV project types, or 'auto' (which is also the default) for
    automatic discovery.

    See https://ddev.readthedocs.io/en/latest/users/configuration/config/#type
    for more information

  --without-database  Create a DDEV project without a database

    Use this flag to create a DDEV project without a database; this is useful
    for projects that do not require a database.

```
