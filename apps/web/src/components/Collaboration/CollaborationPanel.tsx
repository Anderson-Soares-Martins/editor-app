import { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, Check, Link, Hash, Loader2, AlertCircle } from 'lucide-react';
import { useCollaborationStore } from '@/store';
import styles from './Collaboration.module.css';

interface CollaborationPanelProps {
  roomId: string | null;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (roomId: string) => void;
  onLeaveRoom: () => void;
  error: string | null;
  isLoading: boolean;
}

// Extract room ID from URL or return the input as-is
function extractRoomId(input: string): string {
  const trimmed = input.trim();

  // Try to parse as URL
  try {
    const url = new URL(trimmed);
    const roomParam = url.searchParams.get('room');
    if (roomParam) {
      return roomParam;
    }
  } catch {
    // Not a valid URL, continue
  }

  // Check if it looks like a URL with ?room= parameter
  const roomMatch = trimmed.match(/[?&]room=([^&]+)/);
  if (roomMatch) {
    return roomMatch[1];
  }

  // Return as-is (assume it's already a room ID)
  return trimmed;
}

export function CollaborationPanel({
  roomId,
  onJoinRoom,
  onCreateRoom,
  onLeaveRoom,
  error,
  isLoading,
}: CollaborationPanelProps) {
  const { isConnected, cursors, userName } = useCollaborationStore();
  const [inputValue, setInputValue] = useState('');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [extractedId, setExtractedId] = useState<string | null>(null);

  const collaboratorCount = Object.keys(cursors).length + 1;

  // Extract room ID when input changes
  useEffect(() => {
    if (inputValue.trim()) {
      const extracted = extractRoomId(inputValue);
      setExtractedId(extracted !== inputValue.trim() ? extracted : null);
    } else {
      setExtractedId(null);
    }
  }, [inputValue]);

  const handleJoin = () => {
    const idToJoin = extractRoomId(inputValue);
    if (idToJoin) {
      onJoinRoom(idToJoin);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = `room-${Date.now().toString(36)}`;
    onCreateRoom(newRoomId);
  };

  const handleCopyId = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (roomId) {
      const url = `${window.location.origin}?room=${roomId}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading) {
      handleJoin();
    }
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Users size={16} />
        <span>Collaboration</span>
        <div className={styles.status}>
          {isLoading ? (
            <Loader2 size={14} className={styles.loading} />
          ) : isConnected ? (
            <Wifi size={14} className={styles.connected} />
          ) : (
            <WifiOff size={14} className={styles.disconnected} />
          )}
        </div>
      </div>

      {roomId && isConnected ? (
        <div className={styles.content}>
          <div className={styles.roomInfo}>
            <span className={styles.label}>Room ID:</span>
            <span className={styles.roomId}>{roomId}</span>
          </div>

          <div className={styles.copyButtons}>
            <button
              className={styles.copyButton}
              onClick={handleCopyId}
              title="Copy room ID"
            >
              {copiedId ? <Check size={14} /> : <Hash size={14} />}
              <span>Copy ID</span>
            </button>
            <button
              className={styles.copyButton}
              onClick={handleCopyLink}
              title="Copy invite link"
            >
              {copiedLink ? <Check size={14} /> : <Link size={14} />}
              <span>Copy Link</span>
            </button>
          </div>

          <div className={styles.collaborators}>
            <span className={styles.label}>
              {collaboratorCount} collaborator{collaboratorCount !== 1 ? 's' : ''}
            </span>
            <div className={styles.userList}>
              <div className={styles.user}>
                <div
                  className={styles.userAvatar}
                  style={{ backgroundColor: '#4a9eff' }}
                >
                  {userName[0].toUpperCase()}
                </div>
                <span>{userName} (you)</span>
              </div>
              {Object.values(cursors).map((cursor) => (
                <div key={cursor.id} className={styles.user}>
                  <div
                    className={styles.userAvatar}
                    style={{ backgroundColor: cursor.color }}
                  >
                    {cursor.name[0].toUpperCase()}
                  </div>
                  <span>{cursor.name}</span>
                </div>
              ))}
            </div>
          </div>

          <button className={styles.leaveButton} onClick={onLeaveRoom}>
            Leave Room
          </button>
        </div>
      ) : (
        <div className={styles.content}>
          {error && (
            <div className={styles.error}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.joinSection}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Enter room ID or paste invite link"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className={styles.input}
                disabled={isLoading}
              />
              {extractedId && (
                <div className={styles.extractedHint}>
                  Will join: <strong>{extractedId}</strong>
                </div>
              )}
            </div>
            <button
              className={styles.joinButton}
              onClick={handleJoin}
              disabled={!inputValue.trim() || isLoading}
            >
              {isLoading ? <Loader2 size={14} className={styles.loading} /> : 'Join'}
            </button>
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button
            className={styles.createButton}
            onClick={handleCreateRoom}
            disabled={isLoading}
          >
            Create New Room
          </button>
        </div>
      )}
    </div>
  );
}
