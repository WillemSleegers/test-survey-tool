import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLanguage } from "@/contexts/language-context"

interface CompletionDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean
  /** Function to handle dialog state changes */
  onOpenChange: (open: boolean) => void
}

/**
 * Completion dialog shown when user finishes the questionnaire
 * 
 * Features:
 * - Internationalized content
 * - Accessible dialog with proper ARIA attributes
 * - Clean completion messaging
 */
export function CompletionDialog({ isOpen, onOpenChange }: CompletionDialogProps) {
  const { t } = useLanguage()

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('completion.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('completion.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{t('completion.close')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}