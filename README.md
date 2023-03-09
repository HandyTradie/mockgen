## Getting Started

This repository contains the resources and instructions that will get you a copy of the project up and running on your local machine for development and testing purposes, and also with notes on how to deploy the project on a live system.

### Prerequisites

To get the project started, there are some tools you need to install on your local machine. The list of tools you need to install have been provided with a guide on how to install these tools.

##### `Install git`

For users on Mac, the best way to install git is by using [Homebrew](https://brew.sh/). To install Homebrew, open your shell and run the following command:

```
$ /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After the command is done running, check if Homebrew is successfully installed by running:

```
$ brew --version
```

If Homebrew is successfully installed, the version will be logged to the screen. Now proceed to install git using Homebrew with the following command:

```
$ brew install git
```

For users on Windows, download the [latest version](https://git-scm.com/downloads) of Git and choose the 64/32 bit version. After the file is downloaded, install it in the system. Once installed, select Launch the Git Bash, then click on finish. After that, check for a successful installation by opening your terminal and logging the version of git with:

```
$ git --version
```

##### `Install Node.js`

For users on Mac, install Node.js with Homebrew using the following command:

```
$ brew update
$ brew install node
```

For users on Windows, download and install the [Node.js](https://nodejs.org/en/download/) .msi installer. Follow the guide on the installer and node.js should be installed successfully on your local machine. After that, check for a successful installation by logging the version of Node.js with:

```
$ node --version
```

This project also uses google firebase services like storage, firestore, authentication, and hosting. Therefore, we need to have the firebase cli installed.

##### `Install firebase-cli`

```
$ npm install -g firebase-tools
```

Check for a successful installation by running:

```
$ firebase --version
```

### Installation

Now that you have installed the tools required to start the project locally, we provide a step by step instructions that tell you how to get a development environment running. Before you can get the dev environment running, you need to download the project resources (files) from the github repository using git (which you installed earlier). To do this, you simply need to run the following command:

```
$ git clone https://github.com/ecoachlabs/mockgenerator.git
```

After git is done cloning the project repository, move into the project folder and install the dependencies:

```
$ cd mockgenerator
$ npm install -g yarn    // project uses yarn
$ yarn install        // or simply "yarn"
```

Now start the development server with the following command:

```
$ yarn start
```

## Deployment

The project is hosted using firebase hosting. To deploy the app, run the following command:

```
$ firebase deploy --only hosting
```

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `yarn build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
