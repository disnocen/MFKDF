// const mfkdf = require("./mfkdf.js");
const setupModule = require("./src/setup");
const deriveModule = require("./src/derive");
const fs = require("fs");
const readline = require("readline-sync");

function writeDataToFile(fileName, key, value) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(fileName, "utf8"));
  } catch (error) {
    data = {};
  }
  data[key] = value;
  fs.writeFileSync(fileName, JSON.stringify(data));
}

function readFileAndParse(fileName, variable) {
  if (!fs.existsSync(fileName)) {
    console.error(`File ${fileName} does not exist.`);
    return null;
  }

  let recalledData;
  try {
    recalledData = JSON.parse(fs.readFileSync(fileName, "utf8"));
  } catch (error) {
    console.error(`Error parsing file ${fileName}:`, error);
    return null;
  }

  if (!recalledData[variable]) {
    console.error(`Variable ${variable} not found in the file.`);
    return null;
  }

  return recalledData[variable];
}

async function setupKey() {
  try {
    const setup = await setupModule.key(
      [
        await setupModule.factors.password("password"),
        await setupModule.factors.qrcode("@disnocen"),
      ],
      { size: 16, threshold: 1 }
    );

    writeDataToFile("data.txt", "setup", setup);
    writeDataToFile("data.txt", "policy", setup.policy);

    return setup;
  } catch (error) {
    console.error("Error setting up key:", error);
  }
}

async function deriveKey(policy) {
  try {
    // ask for the salt in input
    const salt = readline.question("Enter the salt: ");
    const derive = await deriveModule.key(policy, {
      qrcode: deriveModule.factors.qrcode("@disnocen", salt),
    });

    writeDataToFile("data.txt", "derive", derive);
    writeDataToFile("data.txt", "policy", derive.policy);

    return derive;
  } catch (error) {
    console.error("Error deriving key:", error);
  }
}

async function main() {
  try {
    // The setup|derive variable is taken from the return of setupKey|deriveKey function,
    // while the policy variable is read from the data.txt file.
    // This is done to demonstrate both methods, however, both variables could be read from the data.txt file.
    const setup = await setupKey();
    const policy = readFileAndParse("data.txt", "policy");
    const derive = await deriveKey(policy);

    console.log(derive.key.toString("hex") === setup.key.toString("hex"));
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();
