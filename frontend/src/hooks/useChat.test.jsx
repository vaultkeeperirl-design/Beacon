import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChat } from './useChat';
import * as useSocketModule from './useSocket';
import * as useP2PMeshModule from '../context/P2PContext';

vi.mock('./useSocket', () => ({
  useSocket: vi.fn(),
}));

vi.mock('../context/P2PContext', () => ({
  useP2PSettings: vi.fn(),
}));

describe('useChat', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      id: 'mock-socket-id',
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    useSocketModule.useSocket.mockReturnValue({
      socket: mockSocket,
      isConnected: true
    });

    useP2PMeshModule.useP2PSettings.mockReturnValue({
      username: 'TestUser'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with a welcome message', () => {
    const { result } = renderHook(() => useChat('stream-1'));
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].id).toBe('welcome');
    expect(result.current.isConnected).toBe(true);
  });

  it('joins stream on mount', () => {
    renderHook(() => useChat('stream-1'));
    expect(mockSocket.emit).toHaveBeenCalledWith('join-stream', {
      streamId: 'stream-1',
      username: 'TestUser'
    });
  });

  it('adds a pending message immediately when sending', () => {
    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(result.current.messages).toHaveLength(2); // welcome + pending
    expect(result.current.messages[1].text).toBe('Hello');
    expect(result.current.messages[1].isPending).toBe(true);
    expect(result.current.messages[1].user).toBe('TestUser');
  });

  it('emits chat-message when sending', () => {
    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      result.current.sendMessage('Hello');
    });

    expect(mockSocket.emit).toHaveBeenCalledWith('chat-message', expect.objectContaining({
      streamId: 'stream-1',
      text: 'Hello',
      user: 'TestUser'
    }));
  });

  it('receives standard chat message', () => {
    let chatMessageHandler;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'chat-message') chatMessageHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      chatMessageHandler({
        id: 'msg-1',
        text: 'External msg',
        user: 'OtherUser',
        senderId: 'other-socket',
        color: 'text-red-400'
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].text).toBe('External msg');
  });

  it('replaces pending message with server confirmed message', () => {
    let chatMessageHandler;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'chat-message') chatMessageHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      result.current.sendMessage('Hello World');
    });

    expect(result.current.messages[1].isPending).toBe(true);

    act(() => {
      chatMessageHandler({
        id: 'server-id',
        text: 'Hello World',
        user: 'TestUser',
        senderId: 'mock-socket-id', // matches our socket id
        color: 'text-blue-400'
      });
    });

    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].id).toBe('server-id');
    expect(result.current.messages[1].isPending).toBe(false);
  });

  it('handles user connected event', () => {
    let userConnectedHandler;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'user-connected') userConnectedHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      userConnectedHandler({ id: 'u1', username: 'Alice' });
    });

    expect(result.current.messages[1].text).toContain('Alice joined');
    expect(result.current.messages[1].user).toBe('System');
  });

  it('handles user disconnected event', () => {
    let userDisconnectedHandler;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'user-disconnected') userDisconnectedHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      userDisconnectedHandler({ id: 'u2', username: 'Bob' });
    });

    expect(result.current.messages[1].text).toContain('Bob left');
    expect(result.current.messages[1].user).toBe('System');
  });

  it('limits messages to 100', () => {
    let chatMessageHandler;
    mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'chat-message') chatMessageHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      for(let i=0; i<150; i++){
        chatMessageHandler({
          id: `msg-${i}`,
          text: `Test ${i}`,
          user: 'Other'
        });
      }
    });

    expect(result.current.messages).toHaveLength(100);
    // Should end with the last message
    expect(result.current.messages[99].text).toBe('Test 149');
  });

  it('limits messages to 100 on send', () => {
     let chatMessageHandler;
     mockSocket.on.mockImplementation((event, cb) => {
      if (event === 'chat-message') chatMessageHandler = cb;
    });

    const { result } = renderHook(() => useChat('stream-1'));

    act(() => {
      for(let i=0; i<100; i++){
         chatMessageHandler({
          id: `msg-${i}`,
          text: `Test ${i}`,
          user: 'Other'
        });
      }
    });

    // 100 messages total (some external, some welcome, slice handles it)
    expect(result.current.messages).toHaveLength(100);

    act(() => {
        result.current.sendMessage('My 101st message');
    });

    expect(result.current.messages).toHaveLength(100);
    expect(result.current.messages[99].text).toBe('My 101st message');
  });

  it('does not send empty messages', () => {
     const { result } = renderHook(() => useChat('stream-1'));

     let r;
     act(() => {
       r = result.current.sendMessage('   ');
     });

     expect(r).toBe(false);
     expect(mockSocket.emit).not.toHaveBeenCalledWith('chat-message', expect.anything());
  });
});
