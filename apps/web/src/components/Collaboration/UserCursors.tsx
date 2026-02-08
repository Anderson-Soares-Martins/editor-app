import { Group, Circle, Text, Tag, Label } from 'react-konva';
import { useCollaborationStore } from '@/store';

export function UserCursors() {
  const { cursors, userId } = useCollaborationStore();

  return (
    <>
      {Object.values(cursors).map((cursor) => {
        if (cursor.id === userId) return null;

        return (
          <Group key={cursor.id} x={cursor.x} y={cursor.y}>
            {/* Cursor pointer */}
            <Circle
              radius={6}
              fill={cursor.color}
              stroke="#ffffff"
              strokeWidth={2}
              shadowColor="rgba(0, 0, 0, 0.3)"
              shadowBlur={4}
              shadowOffset={{ x: 1, y: 1 }}
            />
            {/* User name label */}
            <Label x={10} y={-5}>
              <Tag
                fill={cursor.color}
                cornerRadius={3}
                pointerDirection="left"
                pointerWidth={6}
                pointerHeight={6}
              />
              <Text
                text={cursor.name}
                fontSize={11}
                fontFamily="Arial"
                fill="#ffffff"
                padding={4}
              />
            </Label>
          </Group>
        );
      })}
    </>
  );
}
