import { CommandsRegistry, registerCommand, runCommand, UserCommandHandler, CommandHandler } from "./command";
import { readConfig, Config, setUser } from "./config";
import { createUser, deleteAllUsers, getAllUsers, getUserByName } from "./lib/db/queries";
import { addFeed, getRssFeed, getAllFeeds,  createFollow, fetchFollowingFeeds, unfollowFeed } from "./commands/rss";
import { middlewareLoggedIn } from "./middleware";


const registerUser: CommandHandler = async (_cmd, _username: string): Promise<void> => {
    if (!_username) throw new Error("username argument required");
    const result = await createUser(_username);
    setUser(_username);
    console.log("Registered user", result);
};

const setUserLocally: CommandHandler = async (_cmd, _username: string): Promise<void> => {
    if (!_username) throw new Error("username argument required");
    let user = await getUserByName(_username);
    if (!user) {
        throw new Error("User not found; please register first");
    }
    setUser(_username);
    console.log("User set to", _username);
};

const truncateUsers = async (): Promise<void> => {
    await deleteAllUsers();
    console.log("All users deleted");
}

const listUsers = async (): Promise<void> => {
    const users = await getAllUsers();
    users.forEach(user => {
        const isCurrent: boolean = user.name === readConfig().currentUserName;
        console.log(`* ${user.name}${isCurrent ? " (current)" : ""}`);
    });
}

async function main() {
    const commandRegistry: CommandsRegistry = {};

    registerCommand(commandRegistry, "login", setUserLocally);
    registerCommand(commandRegistry, "register", registerUser);
    registerCommand(commandRegistry, "reset", truncateUsers);
    registerCommand(commandRegistry, "users", middlewareLoggedIn(listUsers));
    registerCommand(commandRegistry, "agg", middlewareLoggedIn(getRssFeed));
    registerCommand(commandRegistry, "feeds", middlewareLoggedIn(getAllFeeds));
    registerCommand(commandRegistry, "addfeed", middlewareLoggedIn(addFeed));
    registerCommand(commandRegistry, "follow", middlewareLoggedIn(createFollow));
    registerCommand(commandRegistry, "following", middlewareLoggedIn(fetchFollowingFeeds));
    registerCommand(commandRegistry, "unfollow", middlewareLoggedIn(unfollowFeed));

    const inputs = process.argv.slice(2);

    if (inputs.length === 0) {
        console.error("No command provided");
        process.exit(1);
    }

    const command = inputs[0];
    const args = inputs.slice(1);

    try {
        console.log(`Running command: ${command} with args: ${args.join(", ")}`);
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