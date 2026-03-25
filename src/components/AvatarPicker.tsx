import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiFetch } from '../api/client'

// 20 fun creature/character avatars using different dicebear styles and seeds
const AVATAR_PRESETS = [
  // Bottts — colorful robots
  'https://api.dicebear.com/7.x/bottts/svg?seed=Sparky',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Circuit',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bolt',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gizmo',
  // Fun emoji
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Dragon',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Ghost',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Alien',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Monster',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Skull',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Flame',
  // Adventurer — cute animal creatures
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Tiger',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Bear',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Fox',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Wolf',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Panda',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Owl',
  // Thumbs — quirky characters
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Rocket',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Star',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Comet',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Nova',
]

export function AvatarPicker() {
  const { user, setAvatar } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!user) return null

  async function handleSelect(avatarUrl: string) {
    setSaving(true)
    try {
      await apiFetch(`/users/${user!.id}/avatar`, {
        method: 'PUT',
        body: JSON.stringify({ avatar: avatarUrl }),
      })
      setAvatar(avatarUrl)
      setIsOpen(false)
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="avatar-picker-wrapper">
      <button
        type="button"
        className="avatar-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change avatar"
        title="Change avatar"
      >
        <img
          src={user.avatarUrl}
          alt={`${user.name}'s avatar`}
          className="header-avatar"
          width={32}
          height={32}
        />
      </button>

      {isOpen && (
        <>
          <div className="avatar-picker-backdrop" onClick={() => setIsOpen(false)} />
          <div className="avatar-picker-panel">
            <p className="avatar-picker-title">Choose your avatar</p>
            <div className="avatar-picker-grid">
              {AVATAR_PRESETS.map((url) => (
                <button
                  key={url}
                  type="button"
                  className={`avatar-picker-option${user.avatarUrl === url ? ' avatar-picker-option--selected' : ''}`}
                  onClick={() => handleSelect(url)}
                  disabled={saving}
                  aria-label="Select avatar"
                >
                  <img src={url} alt="" width={48} height={48} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AvatarPicker
