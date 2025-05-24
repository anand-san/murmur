import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./sidebar";

import {
  Plus,
  Settings,
  Bot,
  ChevronDown,
  PanelLeftCloseIcon,
  Clock,
  User,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

import { useModelSelection } from "../../views/AiInteraction/context/ModelSelectionContext";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationContext";
import React, { useEffect } from "react";
import { Button } from "./button";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

export default function SidebarContentData() {
  const {
    selectedModelId,
    setSelectedModelId,
    modelProviders,
    getModelNameById,
  } = useModelSelection();

  const { session } = useAuth();

  const { toggleSidebar, setOpen, setOpenMobile, isMobile } = useSidebar();

  const {
    conversations: recentChats,
    isLoading: isLoadingChats,
    refreshConversations,
  } = useConversations();

  useEffect(() => {
    if (session?.user) {
      refreshConversations();
    }
  }, [session?.user, refreshConversations]);

  const closeSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  // React Router hooks
  const navigate = useNavigate();
  const location = useLocation();

  // Handle new chat creation
  const handleNewChat = () => {
    navigate("/chat/new");
    closeSidebar();
  };

  // Handle chat selection
  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
    closeSidebar();
  };

  // Handle profile navigation
  const handleProfileClick = () => {
    navigate("/profile");
    closeSidebar();
  };

  // Handle settings navigation
  const handleSettingsClick = () => {
    navigate("/settings");
    closeSidebar();
  };

  // Get the currently selected model name
  const currentModelName = getModelNameById(selectedModelId) || "Select Model";

  // Format relative time for chat timestamps
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Sidebar collapsible="icon" className="z-50">
      {/* Header with app name and icon */}
      <SidebarHeader className="flex flex-row items-center justify-between mt-3">
        {/* <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-6"
          />
          
        </div> */}
        <Button
          variant={"ghost"}
          className="group-data-[collapsible=icon]:hidden cursor-pointer flex items-center justify-between rounded-md p-0 text-sm"
          title={"Murmur"}
        >
          <img src="/logo.png" className="h-8 w-8 text-primary" />
          <h2 className="text-md font-semibold">Murmur</h2>
        </Button>
        <div>
          <Button
            variant="link"
            size="sm"
            className="hover:bg-stone-200 rounded-full cursor-pointer p-2"
            onClick={handleNewChat}
            title="Collapse Sidebar"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="link"
            size="sm"
            className="hover:bg-stone-200 rounded-full cursor-pointer p-2 group-data-[collapsible=icon]:hidden"
            onClick={toggleSidebar}
            title="Collapse Sidebar"
          >
            <PanelLeftCloseIcon className="h-5 w-5" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            <Clock className="h-4 w-4 mr-2" />
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingChats ? (
                <SidebarMenuItem>
                  <div className="text-sm text-muted-foreground p-2 group-data-[collapsible=icon]:hidden">
                    Loading...
                  </div>
                </SidebarMenuItem>
              ) : recentChats.length === 0 ? (
                <SidebarMenuItem>
                  <div className="text-sm text-muted-foreground p-2 group-data-[collapsible=icon]:hidden">
                    No recent chats
                  </div>
                </SidebarMenuItem>
              ) : (
                recentChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton
                      isActive={location.pathname === `/chat/${chat.id}`}
                      onClick={() => handleChatSelect(chat.id)}
                      className="py-6 cursor-pointer justify-start text-left group-data-[collapsible=icon]:justify-center"
                      title={chat.title}
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className=" bg-neutral-200 hover:bg-neutral-300 text-xs uppercase">
                          {chat.title.trim()[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <div className="text-sm font-medium truncate">
                          {chat.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(chat.updatedAt)}
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="space-y-2">
          <SidebarMenuItem className="flex gap-2 group-data-[collapsible=icon]:flex-col">
            <SidebarMenuButton
              isActive={location.pathname === "/profile"}
              onClick={handleProfileClick}
              className="cursor-pointer"
            >
              <User />
              <span>Profile</span>
            </SidebarMenuButton>
            <SidebarMenuButton
              isActive={location.pathname === "/settings"}
              onClick={handleSettingsClick}
              className="cursor-pointer"
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Navigation */}
          {/* Model Selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-1 group-data-[collapsible=icon]:hidden">
              Current Model
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={"ghost"}
                  className=" cursor-pointer w-full flex items-center justify-between rounded-md border p-2 text-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-0"
                  title={`Select Model: ${currentModelName}`}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {currentModelName}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 group-data-[collapsible=icon]:hidden" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width] max-h-[300px] overflow-y-auto">
                {modelProviders.map((provider) => (
                  <React.Fragment key={provider.providerName}>
                    {/* Provider Label */}
                    <DropdownMenuLabel className="flex items-center mt-1 first:mt-0">
                      {provider.image && (
                        <img
                          src={provider.image}
                          alt={provider.providerName}
                          className="h-4 w-4 mr-2 rounded-full object-contain"
                        />
                      )}
                      {provider.providerName}
                    </DropdownMenuLabel>

                    {/* Models for this provider as radio items */}
                    <DropdownMenuRadioGroup
                      value={selectedModelId}
                      onValueChange={setSelectedModelId}
                    >
                      {provider.models.map((model) => (
                        <DropdownMenuRadioItem
                          key={model.id}
                          value={model.id}
                          className="cursor-pointer"
                        >
                          <span className="ml-1">{model.name}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>

                    {/* Separator between providers */}
                    <DropdownMenuSeparator />
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
