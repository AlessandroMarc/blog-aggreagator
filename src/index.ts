import { CommandsRegistry, registerCommand } from "./command";
import { readConfig, Config, setUser } from "./config";


function main() {
    var commandRegistry: CommandsRegistry = {};

    registerCommand(commandRegistry, "login", setUser);

    let inputs = process.argv.slice(2);

    console.log(inputs);

    if (inputs.length === 0) {
        console.log("No command provided");
        process.exit(1);
    }

    if (!commandRegistry[inputs[0]]) {
        console.log("Command not found");
        process.exit(1);
    }

    if (inputs.length !== 2) {
        console.log("No or too many usernames provided");
        process.exit(1);
    }


    var command = inputs[0];
    var username = inputs[1]

    setUser(username);
    const config: Config = readConfig();
    console.log(config);
    process.exit(0);
}

main();