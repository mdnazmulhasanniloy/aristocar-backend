/* eslint-disable @typescript-eslint/ban-ts-comment */
import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import fs from 'fs';
import config from './app/config';
import initializeSocketIO from './socket';
import { defaultTask } from './app/utils/defaultTask';
import { User } from './app/modules/user/user.models';
//@ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unused-vars
import 'colors';
let server: Server;
export const io = initializeSocketIO(createServer(app));
// export const io = initializeSocketIO(createServer(app));

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    defaultTask();
    server = app.listen(Number(config.port), () => {
      //@ts-ignore
      console.log(`app is listening on ${config.port}`.green.bold);
    });
    io.listen(Number(config.socket_port));
    console.log(
      //@ts-ignore
      `Socket is listening on port ${config.socket_port}`.yellow.bold,
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    global.socketio = io;
    // const deleUser = await User.deleteMany({role:{$ne:'admin'}})
    // console.log(deleUser);
  } catch (err) {
    console.error(err);
  }
}
main();
process.on('unhandledRejection', err => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
