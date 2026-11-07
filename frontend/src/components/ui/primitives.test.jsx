import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '../test-platform.js'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from './dialog.jsx'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet.jsx'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table.jsx'
import { Button } from './button.jsx'

test('composed button menu trigger opens once on a pointer click', async () => {
  const user = userEvent.setup()
  const onOpenChange = jest.fn()
  render(<DropdownMenu onOpenChange={onOpenChange}><DropdownMenuTrigger render={<Button />}>Open menu</DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem>Choose</DropdownMenuItem></DropdownMenuContent></DropdownMenu>)
  await user.click(screen.getByRole('button', { name: 'Open menu' }))
  expect(await screen.findByRole('menuitem', { name: 'Choose' })).toBeInTheDocument()
  expect(onOpenChange.mock.calls.map(([open, details]) => [open, details.reason])).toEqual([[true, 'trigger-press']])
})

test('dialog bounds content, closes with Escape and restores trigger focus', async () => {
  const user = userEvent.setup()
  render(<Dialog><DialogTrigger>Open details</DialogTrigger><DialogContent>
    <DialogTitle>Details</DialogTitle><DialogDescription>Trip details</DialogDescription>
    <button>Action</button>
  </DialogContent></Dialog>)
  await user.click(screen.getByRole('button', { name: 'Open details' }))
  const dialog = screen.getByRole('dialog', { name: 'Details' })
  expect(dialog).toHaveClass('max-h-[calc(100dvh-2rem)]', 'w-[calc(100%-2rem)]', 'overflow-y-auto')
  await waitFor(() => expect(dialog).toContainElement(document.activeElement))
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  await waitFor(() => expect(screen.getByRole('button', { name: 'Open details' })).toHaveFocus())
})

test('sheet remains scrollable on short viewports', () => {
  render(<Sheet defaultOpen><SheetContent><SheetTitle>Menu</SheetTitle><SheetDescription>Navigation</SheetDescription></SheetContent></Sheet>)
  expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveClass('max-h-dvh', 'overflow-y-auto')
})

test('menu items, including theme settings, participate in keyboard navigation', async () => {
  const user = userEvent.setup()
  const change = jest.fn()
  render(<DropdownMenu><DropdownMenuTrigger>Account</DropdownMenuTrigger><DropdownMenuContent>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuCheckboxItem checked={false} onCheckedChange={change}>Dark mode</DropdownMenuCheckboxItem>
  </DropdownMenuContent></DropdownMenu>)
  await user.tab()
  await user.keyboard('{ArrowDown}')
  await waitFor(() => expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveFocus())
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('menuitemcheckbox', { name: 'Dark mode' })).toHaveFocus()
  expect(screen.getByRole('menu')).toHaveClass('max-h-[var(--available-height)]', 'max-w-[var(--available-width)]')
  await user.keyboard(' ')
  expect(change).toHaveBeenCalledWith(true, expect.anything())
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Account' })).toHaveFocus())
})

test('vertical tabs expose their orientation and use up/down keys', async () => {
  const user = userEvent.setup()
  render(<Tabs orientation="vertical" defaultValue="one"><TabsList aria-label="Days">
    <TabsTrigger value="one">One</TabsTrigger><TabsTrigger value="two">Two</TabsTrigger>
  </TabsList><TabsContent value="one">First day</TabsContent><TabsContent value="two">Second day</TabsContent></Tabs>)
  expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical')
  await user.tab()
  await user.keyboard('{ArrowDown}')
  expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Second day')
})

test('table scroll region is named and keyboard reachable; headers default to columns', async () => {
  const user = userEvent.setup()
  render(<Table aria-label="Expenses"><TableHeader><TableRow><TableHead>Amount</TableHead></TableRow></TableHeader>
    <TableBody><TableRow><TableCell>100</TableCell></TableRow></TableBody></Table>)
  await user.tab()
  expect(screen.getByRole('region', { name: 'Expenses' })).toHaveFocus()
  expect(screen.getByRole('columnheader', { name: 'Amount' })).toHaveAttribute('scope', 'col')
})
