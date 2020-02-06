import { WebSocket } from 'uWebSockets.js';
import { ClientAction, ServerEvent } from '../../../sharedTypes';
import { logError } from '../../utils/logger';

export default class SocketsService {
  sockets: WebSocket[] = [];

  addSocket(socket: WebSocket) {
    this.sockets.push(socket);
  }

  deleteSocket(socket: WebSocket) {
    this.sockets = this.sockets.filter(({ id }) => id === socket.id);
  }

  sendEvent(socket: WebSocket, event: ServerEvent): void {
    try {
      socket.send(JSON.stringify(event));
    } catch (e) {
      logError(e);
    }
  }

  clearSocket(socketId: string) {
    this.sockets.filter(({ id }) => id === socketId);
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

  parseClientMessage(message: any): { action: ClientAction; payload: unknown } {
    const { action, payload } = JSON.parse(message);

    return { action, payload };
  }
}
