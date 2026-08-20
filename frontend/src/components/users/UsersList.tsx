"use client";

import UserRow from "./UserRow";

interface UsersListProps {
  users: any[];
  selectedUserId?: string;
  onSelect: (user: any) => void;
}

export default function UsersList({ users, selectedUserId, onSelect }: UsersListProps) {
  if (!users?.length) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-400 bg-white rounded-xl border border-slate-100">
        No se encontraron usuarios
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
      {users.map((user) => {
        const id = user.id || user.user_id;
        return (
          <UserRow
            key={id}
            user={user}
            isSelected={selectedUserId === id}
            onClick={() => onSelect(user)}
          />
        );
      })}
    </div>
  );
}