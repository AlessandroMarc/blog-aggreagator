import { CommandsRegistry, registerCommand, runCommand } from "./command";
import { readConfig, Config, setUser } from "./config";
import { createUser, deleteAllUsers, getAllUsers, getUserByName } from "./lib/db/queries";


const registerUser = async (_cmd: string, username: string): Promise<void> => {
    if (!username) throw new Error("username argument required");
    const result = await createUser(username);
    setUser(username);
    console.log("Registered user", result);
};

const setUserLocally = async (_cmd: string, username: string): Promise<void> => {
    if (!username) throw new Error("username argument required");
    let user = await getUserByName(username);
    if (!user) {
        throw new Error("User not found; please register first");
    }
    setUser(username);
    console.log("User set to", username);
};

const truncateUsers = async (): Promise<void> => {
    await deleteAllUsers();
    console.log("All users deleted");
}

const listUsers = async (): Promise<void> => {
    const users = await getAllUsers();
    users.forEach(user => {
        const  isCurrent : boolean = user.name === readConfig().currentUserName;
        console.log(`* ${user.name}${isCurrent ? " (current)" : ""}`);
    });
}

const commands: CommandsRegistry = {
    login: setUserLocally,
    register: registerUser,
    users: listUsers,
};

async function main() {
    const commandRegistry: CommandsRegistry = {};

    registerCommand(commandRegistry, "login", setUserLocally);
    registerCommand(commandRegistry, "register", registerUser);
    registerCommand(commandRegistry, "reset", truncateUsers)
    registerCommand(commandRegistry, "users", listUsers);

    const inputs = process.argv.slice(2);

    if (inputs.length === 0) {
        console.error("No command provided");
        process.exit(1);
    }

    const command = inputs[0];
    const args = inputs.slice(1);

    try {
        await runCommand(commandRegistry, command, args);
    } catch (err: any) {
        console.error("Error running command:", err.message || err);
        process.exit(1);
    }

    // after command has run, print config for demonstration purposes
    const config: Config = readConfig();
    process.exit(0);
}

main();