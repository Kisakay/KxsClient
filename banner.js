const packageInfo = require('./package.json');
const config = require('./config.json');

module.exports = {
	banner: `// ==UserScript==
// @name         ${packageInfo.placeholder}
// @namespace    ${packageInfo.namespace}
// @version      ${packageInfo.version}
// @description  ${packageInfo.description}
// @author       ${packageInfo.author}
// @license      ${packageInfo.license}
// @run-at       document-end
// @downloadURL  ${config.base_url}/download/latest-dev.js
// @icon         ${packageInfo.icon}
${config.match.map((match) => `// @match        ${match}`).join('\n')}
${config.grant.map((grant) => `// @grant        ${grant}`).join('\n')}
// ==/UserScript==
;`
}