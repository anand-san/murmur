import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Settings,
  Bot,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Loader2,
  SparklesIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "lucide-react";
import { Button } from "./button";
import { Avatar, AvatarFallback } from "./avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { cn } from "../../lib/utils";
import { useModelSelection } from "../../views/AiInteraction/context/ModelSelectionContext";
import { useAuth } from "../../contexts/AuthContext";
import { useConversations } from "../../contexts/ConversationContext";
import { useAgents } from "../../contexts/AgentsContext";

interface NewSidebarProps {
  className?: string;
  children?: React.ReactNode;
}

const NewSidebar: React.FC<NewSidebarProps> = ({ className, children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    selectedModelId,
    setSelectedModelId,
    modelProviders,
    getModelNameById,
  } = useModelSelection();

  const { session } = useAuth();

  const {
    conversations: recentChats,
    isLoading: isLoadingChats,
    refreshConversations,
  } = useConversations();

  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    isLoading: isLoadingAgents,
  } = useAgents();

  useEffect(() => {
    if (session?.user) {
      refreshConversations();
    }
  }, [session?.user, refreshConversations]);

  // Navigation handlers
  const handleNewChat = () => {
    navigate("/chat/new");
  };

  const handleChatSelect = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleAgentsClick = () => {
    navigate("/agents");
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
    <TooltipProvider>
      <div className={cn("flex h-screen", className)}>
        {/* Left Sidebar */}
        <div
          className={cn(
            "h-full bg-neutral-100/20 transition-all duration-300 ease-in-out flex flex-col",
            isExpanded ? "w-58" : "w-14"
          )}
        >
          {/* Header */}
          {/* <div className="flex items-center justify-between p-4">
            {isExpanded && (
              <div className="flex items-center gap-2">
                <img src="/logo.png" className="h-8 w-8" alt="Murmur" />
                <h2 className="text-lg font-semibold">Murmur</h2>
              </div>
            )}
            {!isExpanded && (
              <div className="flex justify-center w-full">
                <img src="/logo.png" className="h-8 w-8" alt="Murmur" />
              </div>
            )}
          </div> */}

          {/* Recent Chats */}
          <div className="flex-1 p-4 mt-14">
            {isExpanded && (
              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Recent Chats</span>
              </div>
            )}
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLoadingChats ? (
                <div className="text-sm text-gray-500 p-2">
                  {isExpanded ? "Loading..." : "..."}
                </div>
              ) : recentChats.length === 0 ? (
                <div className="text-sm text-gray-500 p-2">
                  {isExpanded ? "No recent chats" : "Empty"}
                </div>
              ) : (
                recentChats.map((chat) => (
                  <div key={chat.id}>
                    <Button
                      variant={
                        location.pathname === `/chat/${chat.id}`
                          ? "secondary"
                          : "ghost"
                      }
                      size={isExpanded ? undefined : "icon"}
                      className={cn(
                        "w-full justify-start h-auto cursor-pointer",
                        !isExpanded && "justify-center rounded-full"
                      )}
                      onClick={() => handleChatSelect(chat.id)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs uppercase bg-neutral-100">
                          {chat.title.trim()[0]}
                        </AvatarFallback>
                      </Avatar>
                      {isExpanded && (
                        <div className="ml-2 flex-1 text-left min-w-0">
                          <div className="text-sm font-medium truncate">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(chat.updatedAt)}
                          </div>
                        </div>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Top Navigation Bar */}
          <div
            className="ml-2 h-14 bg-neutral-100/20 flex items-center justify-between px-4 flex-shrink-0"
            data-tauri-drag-region
          >
            <div className="absolute left-18">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="link"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 rounded-full cursor-pointer"
                  >
                    {isExpanded ? (
                      <PanelRightOpenIcon className="h-5 w-5" />
                    ) : (
                      <PanelLeftOpenIcon className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex-1 flex justify-center items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 h-auto cursor-pointer hover:bg-neutral-200/50 rounded-lg"
                  >
                    <Bot className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {currentModelName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 max-h-[300px] overflow-y-auto"
                  align="center"
                >
                  <DropdownMenuLabel>Select Model</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.entries(modelProviders.providers || {}).map(
                    ([providerKey, provider]) => (
                      <React.Fragment key={providerKey}>
                        <DropdownMenuLabel className="flex items-center mt-1 first:mt-0">
                          {provider.image && (
                            <img
                              src={provider.image}
                              alt={provider.displayName}
                              className="h-4 w-4 mr-2 rounded-full object-contain"
                            />
                          )}
                          {provider.displayName}
                        </DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={selectedModelId}
                          onValueChange={setSelectedModelId}
                        >
                          {(provider.models || []).map((model) => (
                            <DropdownMenuRadioItem
                              key={model.id}
                              value={model.id}
                              className="cursor-pointer"
                            >
                              <span className="ml-1">{model.name}</span>
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                      </React.Fragment>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 py-2 h-auto cursor-pointer hover:bg-neutral-200/50 rounded-lg"
                  >
                    <SparklesIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate max-w-[120px]">
                      {selectedAgent?.name || "Assistant"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 max-h-[300px] overflow-y-auto"
                  align="center"
                >
                  <DropdownMenuLabel className="p-0 px-2">
                    <div className="flex items-center justify-between">
                      <p>Your Agents</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/agents")}
                        className="cursor-pointer"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={selectedAgent?.id?.toString() || "default"}
                    onValueChange={(value) => {
                      if (value === "default") {
                        setSelectedAgent(null, true); // Mark as user selection
                      } else {
                        const agent = agents.find(
                          (a) => a.id.toString() === value
                        );
                        if (agent) setSelectedAgent(agent, true); // Mark as user selection
                      }
                    }}
                  >
                    {isLoadingAgents ? (
                      <div className="flex items-center justify-center text-sm text-gray-500 p-2 space-x-4">
                        <Loader2 className="animate-spin h-4 w-4" />
                        <p>Loading agents...</p>
                      </div>
                    ) : null}
                    {!isLoadingAgents && agents.length === 0 && (
                      <div className="flex flex-col items-center justify-center text-sm text-gray-500 p-2">
                        <p>No Custom Agents</p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => navigate("/agents")}
                          className="p-0 cursor-pointer"
                        >
                          Add Agent
                        </Button>
                      </div>
                    )}
                    {!isLoadingAgents && agents.length !== 0 && (
                      <>
                        {agents.map((agent) => (
                          <DropdownMenuRadioItem
                            key={agent.id}
                            value={agent.id.toString()}
                            className="cursor-pointer"
                          >
                            <span className="ml-1">{agent.name}</span>
                          </DropdownMenuRadioItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right side - Controls */}
            <div className="flex items-center gap-2">
              {/* New Chat */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleNewChat}
                    className="p-2 cursor-pointer rounded-full"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>New Chat</TooltipContent>
              </Tooltip>

              {/* Settings Dropdown */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2  cursor-pointer rounded-full"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleProfileClick}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleAgentsClick}>
                        <Bot className="mr-2 h-4 w-4" />
                        Manage Agents
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSettingsClick}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Menu</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden border-l border-t border-gray-200 rounded-tl-lg">
            {children}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default NewSidebar;
