//@ts-ignore
import * as WebSocket from 'ws';
import { ClientAction, ServerEvent } from '../../../sharedTypes';
import { logError } from '../../utils/logger';

export default class SocketsService {
  sockets: WebSocket[] = [];
  clientMessageHandlers: Record<string, Function> = {};

  private generateSocketId() {
    return Date.now();
  }

  connect(socket: WebSocket, onDisconnect: (socketId: string) => void): string {
    this.addSocket(socket);
    socket.id = this.generateSocketId();
    socket.on('message', (message: string) => {
      this.handleClientMessage(message);
    });
    socket.on('close', () => {
      this.deleteSocket(socket);
      onDisconnect(socket.id);
    });

    return socket.id;
  }

  registerMessageHandlers(handlers: Record<string, Function>) {
    this.clientMessageHandlers = handlers;
  }

  sendEventToSocket(socketId: string, event: ServerEvent) {
    const socket = this.getSocket(socketId);

    this.sendEvent(socket, event);
  }

  broadcastEvent(event: ServerEvent) {
    this.sockets.forEach(socket => {
      try {
        socket.send(JSON.stringify(event));
      } catch (e) {
        logError(e);
        this.clearSocket(socket.id);
      }
    });
  }

  private sendEvent(socket: WebSocket, event: ServerEvent): void {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      logError(e);
    }
  }

  private handleClientMessage(message: string) {
    const { action, payload } = this.parseClientMessage(message);
    const handler = this.clientMessageHandlers[action];

    handler(payload);
  }

  private addSocket(socket: WebSocket) {
    this.sockets.push(socket);
  }

  private deleteSocket(socket: WebSocket) {
    this.sockets = this.sockets.filter(({ id }) => id === socket.id);
  }

  private clearSocket(socketId: string) {
    this.sockets.filter(({ id }) => id === socketId);
  }

  private getSocket(socketId: string) {
    return this.sockets.find(({ id }) => id === socketId);
  }

  private parseClientMessage(
    message: string,
  ): { action: ClientAction; payload: unknown } {
    const { action, payload } = JSON.parse(message);

    return { action, payload };
  }
}
