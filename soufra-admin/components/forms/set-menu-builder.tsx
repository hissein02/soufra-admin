
'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Link as LinkIcon, Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MenuOptions, OptionGroup, OptionChoice } from '@/types'
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

function ItemSelector({
    value,
    onChange,
    items
}: {
    value?: string,
    onChange: (val: string | undefined) => void,
    items: { id: string, name: string }[]
}) {
    const [open, setOpen] = useState(false)

    // Ensure we have a valid selected item object to display name
    const selectedItem = items.find(i => i.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="h-9 w-full justify-between text-xs font-normal"
                >
                    {selectedItem ? selectedItem.name : "Link Item (Optional)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" side="bottom" align="start">
                <Command>
                    <CommandInput placeholder="Search item..." />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="none"
                                onSelect={() => {
                                    onChange(undefined)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        !value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                No Link
                            </CommandItem>
                            {items.map((item) => (
                                <CommandItem
                                    key={item.id}
                                    value={item.name} // Search by name
                                    onSelect={() => {
                                        onChange(item.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {item.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

export function SetMenuBuilder({ value, onChange, existingItems = [] }: { value: MenuOptions, onChange: (val: MenuOptions) => void, existingItems?: { id: string, name: string }[] }) {

    const addGroup = () => {
        const newGroup: OptionGroup = {
            id: crypto.randomUUID(),
            name: '',
            min_selection: 1,
            max_selection: 1,
            choices: []
        }
        onChange([...value, newGroup])
    }

    const removeGroup = (groupId: string) => {
        onChange(value.filter(g => g.id !== groupId))
    }

    const updateGroup = (groupId: string, updates: Partial<OptionGroup>) => {
        onChange(value.map(g => g.id === groupId ? { ...g, ...updates } : g))
    }

    const addChoice = (groupId: string) => {
        const newChoice: OptionChoice = {
            id: crypto.randomUUID(),
            name: '',
            extra_price: 0,
            is_available: true,
            item_id: undefined
        }
        onChange(value.map(g => {
            if (g.id === groupId) {
                return { ...g, choices: [...g.choices, newChoice] }
            }
            return g
        }))
    }

    const removeChoice = (groupId: string, choiceId: string) => {
        onChange(value.map(g => {
            if (g.id === groupId) {
                return { ...g, choices: g.choices.filter(c => c.id !== choiceId) }
            }
            return g
        }))
    }

    const updateChoice = (groupId: string, choiceId: string, updates: Partial<OptionChoice>) => {
        onChange(value.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    choices: g.choices.map(c => c.id === choiceId ? { ...c, ...updates } : c)
                }
            }
            return g
        }))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-[#1F4E5F]">Menu Steps (Options)</Label>
                <Button type="button" onClick={addGroup} variant="outline" size="sm" className="border-dashed border-[#1F4E5F] text-[#1F4E5F]">
                    <Plus className="h-4 w-4 mr-2" /> Add Step
                </Button>
            </div>

            <div className="space-y-4">
                {value.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50 text-gray-500 text-sm">
                        No steps defined. Add a step like "Choose Starter" or "Choose Main".
                    </div>
                )}
                {value.map((group, index) => (
                    <div key={group.id} className="border rounded-lg p-6 bg-white/50 space-y-6 relative group-card shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="mt-2">
                                <span className="text-xs font-mono bg-[#1F4E5F] text-white px-2 py-1 rounded">Step {index + 1}</span>
                            </div>
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase text-gray-500">Step Name</Label>
                                        <Input
                                            value={group.name}
                                            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
                                            placeholder="e.g. Choose your generic starter"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Min Select</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={group.min_selection}
                                                onChange={(e) => updateGroup(group.id, { min_selection: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <Label className="text-xs font-semibold uppercase text-gray-500">Max Select</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={group.max_selection}
                                                onChange={(e) => updateGroup(group.id, { max_selection: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <Label className="text-sm font-medium text-gray-700">Choices</Label>
                                        <Button type="button" onClick={() => addChoice(group.id)} variant="ghost" size="sm" className="h-6 text-xs text-[#E05D34]">
                                            <Plus className="h-3 w-3 mr-1" /> Add Choice
                                        </Button>
                                    </div>
                                    <div className="space-y-3 pl-2">
                                        {group.choices.map((choice) => (
                                            <div key={choice.id} className="flex items-start gap-2 bg-gray-50 p-2 rounded-md">
                                                <div className="grid gap-2 flex-1">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Input
                                                                value={choice.name}
                                                                onChange={(e) => updateChoice(group.id, choice.id, { name: e.target.value })}
                                                                placeholder="Choice Name"
                                                                className="h-9 text-sm bg-white"
                                                            />
                                                        </div>
                                                        <div className="w-[200px]">
                                                            <ItemSelector
                                                                value={choice.item_id}
                                                                onChange={(val) => {
                                                                    const linkedItem = existingItems.find(i => i.id === val);
                                                                    updateChoice(group.id, choice.id, {
                                                                        item_id: val,
                                                                        name: (val && linkedItem && !choice.name) ? linkedItem.name : choice.name
                                                                    })
                                                                }}
                                                                items={existingItems}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1 w-32 relative">
                                                            <span className="absolute right-8 text-gray-400 text-xs">FCFA</span>
                                                            <Input
                                                                type="number"
                                                                value={choice.extra_price}
                                                                onChange={(e) => updateChoice(group.id, choice.id, { extra_price: parseFloat(e.target.value) || 0 })}
                                                                className="h-8 text-sm pr-12 bg-white"
                                                                placeholder="Extra"
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-400">Extra Price</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-gray-400 hover:text-red-500 mt-0.5"
                                                    onClick={() => removeChoice(group.id, choice.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <Button type="button" size="icon" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => removeGroup(group.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
