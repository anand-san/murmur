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
  MessageSquare,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

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
import React from "react";
import { Button } from "./button";

export default function SidebarContentData() {
  // Use the actual model selection context
  const {
    selectedModelId,
    setSelectedModelId,
    modelProviders,
    getModelNameById,
  } = useModelSelection();

  // Use sidebar context to control the sidebar state
  const { toggleSidebar, setOpen, setOpenMobile, isMobile } = useSidebar();

  // Function to close the sidebar
  const closeSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    } else {
      setOpen(false);
    }
  };

  // Use navigate for routing
  const navigate = useNavigate();

  // Get current location to determine active route
  const location = useLocation();

  // Get the currently selected model name
  const currentModelName = getModelNameById(selectedModelId) || "Select Model";

  return (
    <Sidebar collapsible="icon" className="z-50">
      {/* Header with app name and icon */}
      <SidebarHeader className="flex flex-row items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            className="h-8 w-8 text-primary group-data-[collapsible=icon]:h-7"
          />
          <h2 className="text-md font-semibold group-data-[collapsible=icon]:hidden">
            Murmur
          </h2>
        </div>
        <Button
          variant="link"
          size="sm"
          className="hover:bg-stone-200 rounded-full cursor-pointer p-2 group-data-[collapsible=icon]:hidden"
          onClick={toggleSidebar}
          title="Collapse Sidebar"
        >
          <PanelLeftCloseIcon className="h-5 w-5" />
        </Button>
      </SidebarHeader>

      {/* Sidebar Content with menu options */}
      <SidebarContent>
        {/* Actions Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === "/"} asChild>
                  <div>
                    <Button
                      variant={"link"}
                      className="cursor-pointer flex items-center justify-start ml-0 pl-0 gap-2 w-full hover:no-underline"
                      onClick={() => {
                        navigate("/");
                        closeSidebar();
                      }}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Chat</span>
                    </Button>
                    <Button
                      variant="link"
                      size="icon"
                      className="ml-auto h-8 w-8 cursor-pointer"
                      title="New Chat"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === "/settings"}
                  onClick={() => {
                    navigate("/settings");
                    closeSidebar();
                  }}
                  className="cursor-pointer"
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with model selector */}
      <SidebarFooter>
        <div className="p-3 space-y-3">
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
