import { setUser } from "./config";
import { User } from "./schema";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

// helper that sets the current user; exported so it can be reused in tests or
// default command registrations.
export async function handleCommand(cmdName: string, ...args: string[]) {
  if (args.length === 0) {
    throw new Error("No command provided");
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

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  args: string[],
) {
  const handler = registry[cmdName];
  if (!handler) {
    throw new Error("Command not found");
  }
  await handler(cmdName, ...args);
}