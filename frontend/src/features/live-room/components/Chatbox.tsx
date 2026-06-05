import { TextInput, ActionIcon, ScrollArea, Stack, Text, Paper, Flex } from '@mantine/core';
import { MdSend } from 'react-icons/md';

interface Message {
  id: string;
  sender: string;
  text: string;
}

interface ChatboxProps {
  messages: Message[];
}

export function Chatbox({ messages }: ChatboxProps) {
  return (
    <Paper radius="md" p="xs" h="100%" w="100%" bg={'rgba(0, 0, 0, 0.35'} style={{
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      <Flex direction="column" justify="space-between" h="100%">
        <ScrollArea style={{ flex: 1 }} offsetScrollbars>
          <Stack gap={4}>
            {messages.map((msg) => (
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
