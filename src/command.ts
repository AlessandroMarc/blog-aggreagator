import { setUser } from "./config";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

function handleCommand(cmdName: string, ...args: string[]) {
    if (args.length === 0) {
        throw new Error("No command provided");
        return;
    }

    setUser(args[0]);

    console.log("User set to", args[0]);
}

export type CommandsRegistry = {
    [key: string]: CommandHandler;
}

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
    registry[cmdName] = handler;
}

function runCommand(registry: CommandsRegistry, cmdName: string, args: string) {
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error("Command not found");
    }
    handler(cmdName, ...args);
}