import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
  type: string;
  entity_type: string;
  entity_id: number;
  data?: any;
  user_id: number;
  board_id: number;
}

interface UseWebSocketOptions {
  boardId: number;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
}

export function useWebSocket({ boardId, enabled = true, onMessage }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled || !boardId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/api/ws/boards/${boardId}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected to board:', boardId);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        // 调用自定义消息处理器
        if (onMessage) {
          onMessage(message);
        }

        // 根据消息类型更新 React Query 缓存
        handleWebSocketMessage(queryClient, message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      wsRef.current = null;

      // 尝试重连
      if (enabled) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };
  }, [boardId, enabled, onMessage, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // 心跳保活
  useEffect(() => {
    if (!wsRef.current) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}

function handleWebSocketMessage(queryClient: ReturnType<typeof useQueryClient>, message: WebSocketMessage) {
  const { type, entity_type, entity_id, data, board_id } = message;

  // 更新看板数据
  if (entity_type === 'card') {
    queryClient.invalidateQueries({ queryKey: ['board', board_id] });

    if (type === 'deleted') {
      // 移除卡片缓存
      queryClient.removeQueries({ queryKey: ['card', entity_id] });
    } else if (data) {
      // 更新卡片缓存
      queryClient.setQueryData(['card', entity_id], { data });
    }
  }

  // 更新列表数据
  if (entity_type === 'list') {
    queryClient.invalidateQueries({ queryKey: ['board', board_id] });
  }

  // 更新评论
  if (entity_type === 'comment') {
    queryClient.invalidateQueries({ queryKey: ['card', entity_id] });
  }

  // 更新检查清单
  if (entity_type === 'checklist_item') {
    queryClient.invalidateQueries({ queryKey: ['card'] });
  }
}