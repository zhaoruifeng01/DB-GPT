/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IApp } from '@/types/app';
import type { ChatHistoryResponse } from '@/types/chat';
import { createContext } from 'react';
import type React from 'react';

export interface MobileChatProps {
  model: string;
  temperature: number;
  resource: any;
  setResource: React.Dispatch<React.SetStateAction<any>>;
  setTemperature: React.Dispatch<React.SetStateAction<number>>;
  setModel: React.Dispatch<React.SetStateAction<string>>;
  scene: string;
  history: ChatHistoryResponse;
  setHistory: React.Dispatch<React.SetStateAction<ChatHistoryResponse>>;
  scrollViewRef: React.RefObject<HTMLDivElement>;
  appInfo: IApp;
  conv_uid: string;
  resourceList?: Record<string, any>[];
  order: React.MutableRefObject<number>;
  handleChat: (_content?: string) => Promise<void>;
  canAbort: boolean;
  setCarAbort: React.Dispatch<React.SetStateAction<boolean>>;
  canNewChat: boolean;
  setCanNewChat: React.Dispatch<React.SetStateAction<boolean>>;
  ctrl: React.MutableRefObject<AbortController | undefined>;
  userInput: string;
  setUserInput: React.Dispatch<React.SetStateAction<string>>;
  getChatHistoryRun: () => void;
}

export const MobileChatContext = createContext<MobileChatProps>({
  model: '',
  temperature: 0.5,
  resource: null,
  setModel: () => {},
  setTemperature: () => {},
  setResource: () => {},
  scene: '',
  history: [],
  setHistory: () => {},
  scrollViewRef: { current: null },
  appInfo: {} as IApp,
  conv_uid: '',
  resourceList: [],
  order: { current: 1 },
  handleChat: () => Promise.resolve(),
  canAbort: false,
  setCarAbort: () => {},
  canNewChat: false,
  setCanNewChat: () => {},
  ctrl: { current: undefined },
  userInput: '',
  setUserInput: () => {},
  getChatHistoryRun: () => {},
});
