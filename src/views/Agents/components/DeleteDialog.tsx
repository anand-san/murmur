import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { UserAgent } from "../../../api/agents";
import { AlertTriangle } from "lucide-react";

interface DeleteDialogProps {
  agent: UserAgent | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  agent,
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!agent) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done by the parent component
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Delete Agent
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-gray-600 space-y-3">
          <p>
            Are you sure you want to delete the agent{" "}
            <strong>"{agent.name}"</strong>?
          </p>
          <p>
            This action cannot be undone. The agent and its configuration will
            be permanently removed.
          </p>
          {agent.isDefault && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> This is your default agent. After
                deletion, no agent will be set as default.
              </p>
            </div>
          )}
        </DialogDescription>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="min-w-[100px]"
          >
            {isDeleting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </div>
            ) : (
              "Delete Agent"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteDialog;
