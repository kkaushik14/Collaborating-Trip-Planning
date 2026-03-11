import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { CameraIcon, EditIcon, MailIcon, PhoneIcon, SaveIcon, UserIcon, XIcon } from 'lucide-react'

import { Form, FormMessage, RHFTextField } from '@/components/forms/index.js'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/index.js'
import { profileSettingsSchema } from '@/validators/index.js'

const toDisplayValue = (value) => (typeof value === 'string' ? value : '')

const getInitials = (name = '', email = '') => {
  const source = String(name || email || '')
  return source
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join('')
}

function UserProfileSettingsDialog({
  open,
  onOpenChange,
  currentUser,
  onSave,
  onNoChanges,
  isSaving = false,
}) {
  const [isNameEditing, setIsNameEditing] = useState(false)
  const [isEmailEditing, setIsEmailEditing] = useState(false)
  const [isMobileEditing, setIsMobileEditing] = useState(false)
  const [isAvatarEditing, setIsAvatarEditing] = useState(false)

  const emailUpdateCount = Number(currentUser?.emailUpdateCount || 0)
  const emailUpdateLimit = Number(currentUser?.emailUpdateLimit || 2)
  const emailUpdatesRemaining = Math.max(0, emailUpdateLimit - emailUpdateCount)
  const emailEditLocked = emailUpdatesRemaining <= 0

  const form = useForm({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      name: toDisplayValue(currentUser?.name),
      email: toDisplayValue(currentUser?.email),
      mobileNumber: toDisplayValue(currentUser?.mobileNumber),
      avatarUrl: toDisplayValue(currentUser?.avatarUrl),
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })

  const watchedAvatarUrl = useWatch({
    control: form.control,
    name: 'avatarUrl',
  })
  const watchedMobileNumber = useWatch({
    control: form.control,
    name: 'mobileNumber',
  })
  const hasAvatar = Boolean(String(watchedAvatarUrl || '').trim())
  const hasMobile = Boolean(String(watchedMobileNumber || '').trim())
  const resetEditingModes = () => {
    setIsNameEditing(false)
    setIsEmailEditing(false)
    setIsMobileEditing(false)
    setIsAvatarEditing(false)
  }

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      name: toDisplayValue(currentUser?.name),
      email: toDisplayValue(currentUser?.email),
      mobileNumber: toDisplayValue(currentUser?.mobileNumber),
      avatarUrl: toDisplayValue(currentUser?.avatarUrl),
    })
  }, [currentUser, form, open])

  const profileInitials = useMemo(
    () => getInitials(currentUser?.name, currentUser?.email),
    [currentUser?.email, currentUser?.name],
  )

  const handleSubmit = async (values) => {
    const payload = {}
    const currentName = String(currentUser?.name || '').trim()
    const currentEmail = String(currentUser?.email || '').trim().toLowerCase()
    const currentMobile = String(currentUser?.mobileNumber || '').trim()
    const currentAvatar = String(currentUser?.avatarUrl || '').trim()

    if (isNameEditing) {
      const nextName = String(values.name || '').trim()
      if (nextName && nextName !== currentName) {
        payload.name = nextName
      }
    }

    if (isEmailEditing && !emailEditLocked) {
      const nextEmail = String(values.email || '').trim().toLowerCase()
      if (nextEmail && nextEmail !== currentEmail) {
        payload.email = nextEmail
      }
    }

    if (isMobileEditing) {
      const nextMobile = String(values.mobileNumber || '').trim()
      if (nextMobile !== currentMobile) {
        payload.mobileNumber = nextMobile || null
      }
    }

    if (isAvatarEditing) {
      const nextAvatar = String(values.avatarUrl || '').trim()
      if (nextAvatar !== currentAvatar) {
        payload.avatarUrl = nextAvatar || null
      }
    }

    if (!Object.keys(payload).length) {
      onNoChanges?.()
      return
    }

    await Promise.resolve(onSave?.(payload))
    setIsNameEditing(false)
    setIsEmailEditing(false)
    setIsMobileEditing(false)
    setIsAvatarEditing(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetEditingModes()
        }
        onOpenChange?.(nextOpen)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your name, email, avatar, and contact information.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-sm rounded-xl border border-line bg-panel-muted p-md">
          <Avatar size="lg" className="size-20">
            {hasAvatar ? <AvatarImage src={watchedAvatarUrl} alt="User avatar" /> : null}
            <AvatarFallback>{profileInitials || 'U'}</AvatarFallback>
          </Avatar>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAvatarEditing((previous) => !previous)}
          >
            <CameraIcon className="size-4" />
            {isAvatarEditing ? 'Close Avatar Edit' : hasAvatar ? 'Edit Avatar' : 'Add Avatar'}
          </Button>
          {hasAvatar && isAvatarEditing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                form.setValue('avatarUrl', '', { shouldDirty: true, shouldValidate: true })
              }}
            >
              <XIcon className="size-4" />
              Remove Avatar
            </Button>
          ) : null}
        </div>

        <Form methods={form} onSubmit={handleSubmit} className="space-y-sm">
          <div className="grid gap-sm sm:grid-cols-[1fr_auto] sm:items-end">
            <RHFTextField
              name="name"
              label="Full Name"
              required
              disabled={!isNameEditing}
              placeholder="Your full name"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNameEditing((previous) => !previous)}
            >
              <UserIcon className="size-4" />
              {isNameEditing ? 'Cancel' : 'Edit Name'}
            </Button>
          </div>

          <div className="grid gap-sm sm:grid-cols-[1fr_auto] sm:items-end">
            <RHFTextField
              name="email"
              label="Email"
              type="email"
              required
              disabled={!isEmailEditing || emailEditLocked}
              placeholder="you@example.com"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={emailEditLocked}
              onClick={() => setIsEmailEditing((previous) => !previous)}
            >
              <MailIcon className="size-4" />
              {emailEditLocked
                ? 'Email Locked'
                : isEmailEditing
                  ? 'Cancel'
                  : 'Edit Email'}
            </Button>
          </div>
          <p className="text-caption text-ink-muted">
            Email edits remaining: {emailUpdatesRemaining} of {emailUpdateLimit}
          </p>

          {isAvatarEditing ? (
            <RHFTextField
              name="avatarUrl"
              label="Avatar URL"
              placeholder="https://example.com/avatar.png"
            />
          ) : null}

          <div className="grid gap-sm sm:grid-cols-[1fr_auto] sm:items-end">
            <RHFTextField
              name="mobileNumber"
              label="Mobile Number"
              disabled={!isMobileEditing}
              placeholder={hasMobile ? 'Enter mobile number' : 'Add mobile number (optional)'}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMobileEditing((previous) => !previous)}
            >
              <PhoneIcon className="size-4" />
              {isMobileEditing
                ? 'Cancel'
                : hasMobile
                  ? 'Edit Mobile'
                  : 'Add Mobile'}
            </Button>
          </div>

          {form.formState.errors?.root?.message ? (
            <FormMessage>{form.formState.errors.root.message}</FormMessage>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving || form.formState.isSubmitting}>
              <SaveIcon className="size-4" />
              {isSaving || form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default UserProfileSettingsDialog
