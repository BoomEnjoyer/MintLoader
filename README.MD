# MintLoader
**Free and open source windows botnet.**

MintLoader is a simple windows botnet coded entirely in node.js. It has only two features for the moment: download & execute and visit url. It also has a persistence system and some other options. It is based on http communication which makes it very stable.

## Screenshots
![bots](images/bots.png)
![builds](images/builds.png)
![tasks](images/tasks.png)

## Features
* Download & Execute
* Visit url
* Different persistence methods
* Very stable
* Not detectable by antivirus software
* Obfuscation
* ... and many more!

## How to use ?

### Windows System
* rename config_example.js to config.js and complete the information of this configuration.
* install [Node.js](https://nodejs.org/) if not already done.
* install updated [Python](https://www.python.org/) and [Visual Studio](https://visualstudio.microsoft.com/) with c++ extension.
* run `npm i -g pkg && npm i` at the root of the folder.
* run `npm i` in the client folder.
* launch it using `node app.js`.
* navigate to `config.baseurl + panel/login` and profit !

### Linux System
for the loader to be functional under linux it will be necessary to install native nodejs modules that can only be built under windows.
* take a windows with updated python and visual studio with the c++ development extension.
* install [Node.js](https://nodejs.org/) if not already done on both windows and linux.
* run `npm i` at the root of the folder on windows.
* run `npm i` in the client folder on windows.
* copy the two folders `node_modules` created with the two previous commands from your windows to the same place in the MintLoader folder on your linux.
* run `npm i -g pkg` on linux.
* rename config_example.js to config.js and complete the information of this configuration on linux.
* launch on linux it using `node app.js`.
* navigate to `config.baseurl + panel/login` and profit !

## Supported operating systems
**Client**
* Every windows system supported by Node.js now (Windows 8.1 .. Windows 11).

**Panel**
* All operating systems that Node.js currently supports.

## License
MintLoader is distributed under the [MIT License](LICENSE).

## Thank you!
I really appreciate all kinds of feedback and contributions. Thanks for using and supporting MintLoader!