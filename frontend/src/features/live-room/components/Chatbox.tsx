import { TextInput, ActionIcon, ScrollArea, Stack, Text, Paper, Flex } from '@mantine/core';
import { MdSend } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  sender: string;
  text: string;
}

interface ChatboxProps {
  messages: Message[];
}

export function Chatbox({ messages: propMessages }: ChatboxProps) {
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockSenders = ['小明', '王伟', '用户_883', '买家_12', '李娜', '张伟', '陈洁', '刘洋', '大佬_99'];
    const mockTexts = [
      '太美了！', '我要这个', '太贵了', '有人出价比我高吗？',
      '冲冲冲', '喜欢 😍', '我能赢吗？', '不错', '加油', '等一下...',
      '这也太划算了吧', '必须拿下', '稍微超预算了', '没钱了 😭', '再加一点点',
      '谁在跟我抢？', '品质看起来很好', '好期待啊', '不买了，让给你们', '快结束了吧？',
      '这件是正品吗？', '值得这个价', '手速要快', '我放弃了', '再看看其他的',
      '好想买啊', '别跟我抢', '犹豫了一下，被抢了', '加价！', '最后十秒！'
    ];

    let count = 0;
    const interval = setInterval(() => {
      const newMsg = {
        id: `mock-${Date.now()}-${count}`,
        sender: mockSenders[Math.floor(Math.random() * mockSenders.length)],
        text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
      };

      setLocalMessages(prev => {
        const next = [...prev, newMsg];
        if (next.length > 50) return next.slice(next.length - 50); // Keep max 50 local messages
        return next;
      });
      count++;
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const displayMessages = [...propMessages, ...localMessages];

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [displayMessages.length]);

  return (
    <Paper radius="md" p="xs" h={285.5} mih={285.5} mah={285.5} w="100%" bg={'rgba(0, 0, 0, 0.35'} style={{
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <Flex direction="column" justify="space-between" h="100%" style={{ overflow: 'hidden' }}>
        <ScrollArea style={{ flex: 1, minHeight: 0 }} type="never" viewportRef={viewportRef}>
          <Stack gap={4}>
            {displayMessages.map((msg) => (
              <Text key={msg.id} size="xs" c={'white'} lh={1.2}>
                <Text span fw="bold" c='blue.2' >
                  {msg.sender}:
                </Text>{' '}
                {msg.text}
              </Text>
            ))}
          </Stack>
        </ScrollArea>
        <TextInput
          mt={4}
          size="xs"
          placeholder="Say something..."
          rightSection={
            <ActionIcon size={30}>
              <MdSend />
            </ActionIcon>
          }
          variant=''
        />
      </Flex>
    </Paper>
  );
}
