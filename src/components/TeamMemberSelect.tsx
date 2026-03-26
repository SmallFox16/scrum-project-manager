import {
  useState,
  useRef,
  useEffect,
  useId,
  useMemo,
  useCallback,
} from 'react'
import { useTeam } from '../hooks/queries/useTeam'
import type { TaskAssignee } from '../types'

interface TeamMemberSelectProps {
  taskId: string;
  assignees: TaskAssignee[];
  onAssign: (taskId: string, assignees: TaskAssignee[]) => void;
}

export function TeamMemberSelect({
  taskId,
  assignees,
  onAssign,
}: TeamMemberSelectProps) {
  const { data: teamMembers = [], isPending } = useTeam()

  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const optionIdPrefix = useId()

  const assigneeIds = useMemo(() => new Set(assignees.map((a) => a.id)), [assignees])

  // Filter members client-side based on what the user has typed
  const filteredMembers = useMemo(() => {
    const query = inputValue.trim().toLowerCase()
    if (query === '') return teamMembers
    return teamMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.role.toLowerCase().includes(query),
    )
  }, [teamMembers, inputValue])

  // Close dropdown and reset state
  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setActiveIndex(-1)
    setInputValue('')
  }, [])

  // Toggle a member (add or remove)
  const toggleMember = useCallback(
    (memberId: string, memberName: string) => {
      let newAssignees: TaskAssignee[]
      if (assigneeIds.has(memberId)) {
        newAssignees = assignees.filter((a) => a.id !== memberId)
      } else {
        newAssignees = [...assignees, { id: memberId, name: memberName }]
      }
      onAssign(taskId, newAssignees)
    },
    [taskId, assignees, assigneeIds, onAssign],
  )

  // Remove a specific assignee
  const removeAssignee = useCallback(
    (memberId: string) => {
      const newAssignees = assignees.filter((a) => a.id !== memberId)
      onAssign(taskId, newAssignees)
    },
    [taskId, assignees, onAssign],
  )

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (
        wrapperRef.current !== null &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        closeDropdown()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [closeDropdown])

  // Reset active index when the filtered list changes
  useEffect(() => {
    setActiveIndex(-1)
  }, [filteredMembers])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
    setIsOpen(true)
  }

  function handleInputFocus() {
    setIsOpen(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        setActiveIndex((prev) =>
          prev < filteredMembers.length - 1 ? prev + 1 : prev,
        )
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0))
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < filteredMembers.length) {
          const m = filteredMembers[activeIndex]
          toggleMember(m.id, m.name)
        }
        break
      }
      case 'Escape': {
        e.preventDefault()
        closeDropdown()
        break
      }
    }
  }

  const activeOptionId =
    activeIndex >= 0 ? `${optionIdPrefix}-opt-${activeIndex}` : undefined

  if (isPending) {
    return (
      <div className="team-member-select">
        <span className="team-member-select__label">Assignees:</span>
        <span className="team-member-select__loading" aria-label="Loading team members">
          Loading...
        </span>
      </div>
    )
  }

  return (
    <div className="team-member-select" ref={wrapperRef}>
      <span className="team-member-select__label" id={`${optionIdPrefix}-label`}>
        Assignees:
      </span>

      {/* Show assigned member chips */}
      {assignees.length > 0 && !isOpen && (
        <div className="team-member-select__chips">
          {assignees.map((a) => (
            <span key={a.id} className="team-member-select__chip">
              {a.name}
              <button
                type="button"
                className="team-member-select__chip-remove"
                onClick={() => removeAssignee(a.id)}
                aria-label={`Remove ${a.name}`}
              >
                &#10005;
              </button>
            </span>
          ))}
          <button
            type="button"
            className="team-member-select__add-btn"
            onClick={() => {
              setIsOpen(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            aria-label="Add assignee"
          >
            +
          </button>
        </div>
      )}

      {/* Combobox input — shown when no assignees or dropdown is open */}
      {(assignees.length === 0 || isOpen) && (
        <div className="team-member-select__input-wrapper">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            aria-labelledby={`${optionIdPrefix}-label`}
            aria-autocomplete="list"
            className="team-member-select__input"
            placeholder="Search team..."
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {isOpen && (
            <ul
              id={listId}
              role="listbox"
              aria-label="Team members"
              aria-multiselectable="true"
              className="team-member-select__listbox"
            >
              {filteredMembers.length === 0 ? (
                <li
                  role="option"
                  aria-selected={false}
                  aria-disabled="true"
                  className="team-member-select__option team-member-select__option--empty"
                >
                  No members match &ldquo;{inputValue}&rdquo;
                </li>
              ) : (
                filteredMembers.map((member, index) => {
                  const optionId = `${optionIdPrefix}-opt-${index}`
                  const isActive = index === activeIndex
                  const isSelected = assigneeIds.has(member.id)

                  return (
                    <li
                      key={member.id}
                      id={optionId}
                      role="option"
                      aria-selected={isSelected}
                      className={[
                        'team-member-select__option',
                        isActive ? 'team-member-select__option--active' : '',
                        isSelected ? 'team-member-select__option--selected' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        toggleMember(member.id, member.name)
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                    >
                      <img
                        src={member.avatarUrl}
                        alt=""
                        className="team-member-select__option-avatar"
                        width={24}
                        height={24}
                        aria-hidden="true"
                      />
                      <span className="team-member-select__option-info">
                        <span className="team-member-select__option-name">
                          {member.name}
                        </span>
                        <span className="team-member-select__option-role">
                          {member.role}
                        </span>
                      </span>
                      {isSelected && (
                        <span
                          className="team-member-select__option-check"
                          aria-hidden="true"
                        >
                          &#10003;
                        </span>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default TeamMemberSelect
