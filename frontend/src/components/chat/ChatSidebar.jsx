import { getInitials, useSelectedConversation } from "../../hooks/useSelectedConversation";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
import { useShallow } from "zustand/react/shallow";
import { APP_NAME, AppLogo } from "../AppLogo";
import { UserButton } from "@clerk/react";
import { dark } from "@clerk/themes";
import { useTheme } from "../../context/theme";

import { Button, SearchField, Tabs } from "@heroui/react";
import { LogOutIcon, MessageSquareIcon, UsersIcon } from "lucide-react";
import toast from "react-hot-toast";
import { ConversationRow } from "./ConversationRow";

function mapUserForList(user, onlineUsers) {
  return {
    conversationId: user._id,
    id: user._id,
    name: user.fullName,
    avatarUrl: user.profilePic,
    initials: getInitials(user.fullName),
    isOnline: onlineUsers.includes(user._id),
    peer: {
      name: user.fullName,
      avatarUrl: user.profilePic,
      initials: getInitials(user.fullName),
      isOnline: onlineUsers.includes(user._id),
    },
  };
}

function ChatSidebar() {
  const { theme } = useTheme();

  const {
    conversations,
    users,
    searchQuery,
    setSearchQuery,
    sidebarTab,
    setSidebarTab,
    setActiveConversationId,
  } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      users: state.users,
      searchQuery: state.searchQuery,
      setSearchQuery: state.setSearchQuery,
      sidebarTab: state.sidebarTab,
      setSidebarTab: state.setSidebarTab,
      setActiveConversationId: state.setActiveConversationId,
    })),
  );

  const { authUser, logoutGuest, onlineUsers } = useAuthStore(
    useShallow((state) => ({
      authUser: state.authUser,
      logoutGuest: state.logoutGuest,
      onlineUsers: state.onlineUsers,
    })),
  );

  const handleGuestLogout = () => {
    logoutGuest();
    toast.success("Guest session ended.");
  };

  const { activeConversationId, isLargeScreen } = useSelectedConversation();

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const conversationUsers = conversations.map((user) => mapUserForList(user, onlineUsers));
  const allUsers = users.map((user) => mapUserForList(user, onlineUsers));

  const filteredConversations = normalizedSearchQuery
    ? conversationUsers.filter((conversation) =>
        conversation.peer.name.toLowerCase().includes(normalizedSearchQuery),
      )
    : conversationUsers;

  const filteredUsers = normalizedSearchQuery
    ? allUsers.filter((user) => user.name.toLowerCase().includes(normalizedSearchQuery))
    : allUsers;

  return (
    <aside
      className={`w-full shrink-0 flex-col overflow-hidden border-r border-border lg:w-72 ${
        !isLargeScreen && activeConversationId ? "hidden lg:flex" : "flex"
      }`}
    >
      <div className="shrink-0 border-b border-border px-2 pb-2 pt-2.5 sm:px-3 sm:pt-3">
        <div className="flex items-center gap-2 px-0.5 sm:gap-2.5 sm:px-1">
          <AppLogo size={32} className="size-8 shrink-0 rounded-[9px] sm:size-8.5" alt="" />
          <p className="flex-1 truncate text-lg font-bold tracking-tight sm:text-[22px]">
            {APP_NAME}
          </p>
          {authUser?.isGuest ? (
            <div className="flex items-center gap-1.5">
              <div
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-accent/10 overflow-hidden"
                title={`${authUser.fullName} (Guest)`}
              >
                <img
                  src={
                    authUser.profilePic ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.fullName)}&background=0D8ABC&color=fff`
                  }
                  alt={authUser.fullName}
                  className="size-full object-cover"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label="Exit guest session"
                title="Exit guest session"
                className="size-8 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition-colors"
                onPress={handleGuestLogout}
              >
                <LogOutIcon className="size-4" />
              </Button>
            </div>
          ) : (
            <UserButton
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  avatarBox: "size-8",
                },
              }}
            />
          )}
        </div>
      </div>

      <Tabs
        selectedKey={sidebarTab}
        onSelectionChange={(key) => setSidebarTab(String(key))}
        variant="secondary"
        className="flex flex-1 flex-col overflow-y-auto"
      >
        <div className="shrink-0 border-b border-border px-3 pb-2 pt-2">
          <SearchField
            fullWidth
            variant="secondary"
            className="w-full"
            aria-label="Search conversations or users"
            value={searchQuery}
            onChange={setSearchQuery}
          >
            <SearchField.Group className="rounded-xl">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search" aria-label="Search contacts" />
              {searchQuery ? <SearchField.ClearButton /> : null}
            </SearchField.Group>
          </SearchField>
        </div>

        <Tabs.ListContainer className="shrink-0 border-b border-border px-2 pb-2 pt-1">
          <Tabs.List className="w-full gap-0.5">
            <Tabs.Tab id="chats" className="flex-1 justify-center gap-1.5">
              <MessageSquareIcon className="size-3.5 opacity-80" aria-hidden />
              Chats
            </Tabs.Tab>
            <Tabs.Tab id="users" className="flex-1 justify-center gap-1.5">
              <UsersIcon className="size-3.5 opacity-80" aria-hidden />
              Users
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel
          id="chats"
          className="flex-1 overflow-x-hidden overflow-y-auto outline-none"
        >
          {filteredConversations.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No conversations match your search.
            </p>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationRow
                key={conversation.id}
                user={conversation}
                selected={conversation.id === activeConversationId}
                onSelect={() => setActiveConversationId(conversation.id)}
              />
            ))
          )}
        </Tabs.Panel>

        <Tabs.Panel id="users" className="flex-1 overflow-x-hidden overflow-y-auto outline-none">
          {filteredUsers.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No people match your search.</p>
          ) : (
            filteredUsers.map((user) => (
              <ConversationRow
                key={user.conversationId}
                user={user}
                selected={user.conversationId === activeConversationId}
                onSelect={() => setActiveConversationId(user.conversationId)}
              />
            ))
          )}
        </Tabs.Panel>
      </Tabs>
    </aside>
  );
}
export default ChatSidebar;
