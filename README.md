# Euphony.js

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0) [![](https://data.jsdelivr.com/v1/package/gh/designe/euphony.js/badge?style=rounded)](https://www.jsdelivr.com/package/gh/designe/euphony.js) 

Acoustic Data Telecommunication Library. This repository is for Javascript.

## Prerequisite

``` html
<script src='https://cdn.jsdelivr.net/gh/designe/euphony.js/dist/euphony.min.js'></script>

<!-- if you want to use module version of euphony, import this like below.
<script type='module'>
    import {Euphony} from "https://cdn.jsdelivr.net/gh/designe/euphony.js/dist/euphony.m.min.js";
</script>
-->

```

## Usage
```javascript
var euphony = new Euphony();
euphony.setCode("hello, euphony");
euphony.play();

// if you want to stop sound
euphony.stop();
```

## Setup local development installation
### Installing Node.js and npm
If you use ``conda``, you can get them with::

    conda install -c conda-forge nodejs

If you use [Homebrew](https://brew.sh/) on Mac OS X::

    brew install node

Installation on Linux may vary, but be aware that the `nodejs` or `npm` packages
included in the system package repository may be too old to work properly.

You can also use the installer from the [Node.js website](https://nodejs.org).

### Installing node modules
```
cd euphony.js
npm install
```

### Development Tip
When doing development, you can use this command to run local server.  
Check demo: http://localhost:8080/demo  
Check test: http://localhost:8080/test
```
npm run dev
```

## Contributing
Changes are improvements are more than welcome! Feel Free to fork and open a pull request. Please make your changes in a specific branch and request to pull into `master`.

## License
Euphony is licensed under the Apache 2.0 license. (https://github.com/designe/euphony.js/blob/master/LICENSE)
