import { useMemo, useState } from 'react'
import { SparklesIcon } from 'lucide-react'

import {
  AnalyticsPanel,
  CollaborationPanel,
  Heading,
  OrganizationPanel,
  Text,
  TripPlanningPanel,
} from '../components/index.js'
import { homePageData } from './homePageData.js'

const HomePage = () => {
  const [itineraryDays, setItineraryDays] = useState(homePageData.tripPlanning.days)
  const [selectedDayId, setSelectedDayId] = useState(homePageData.tripPlanning.days[0]?.id || '')
  const [members, setMembers] = useState(homePageData.collaboration.members)
  const [invitations, setInvitations] = useState(homePageData.collaboration.invitations)
  const [comments, setComments] = useState(homePageData.collaboration.comments)
  const [checklists, setChecklists] = useState(homePageData.organization.checklists)

  const collaborationSummary = useMemo(
    () =>
      `${members.filter((member) => member.isActive).length} active members, ${invitations.length} pending invites`,
    [members, invitations],
  )

  const handleActivitiesReorder = (dayId, reorderedActivities) => {
    setItineraryDays((previousDays) =>
      previousDays.map((day) =>
        day.id === dayId ? { ...day, activities: reorderedActivities } : day,
      ),
    )
  }

  const handleAddActivity = (dayId) => {
    setItineraryDays((previousDays) =>
      previousDays.map((day) => {
        if (day.id !== dayId) {
          return day
        }

        const nextIndex = day.activities.length + 1
        const nextActivity = {
          id: `${day.id}-new-${nextIndex}`,
          title: `New activity ${nextIndex}`,
          description: 'Draft activity. Replace with real details from form flow.',
          startTime: '15:00',
          endTime: '16:00',
          location: 'TBD',
          category: 'Draft',
          estimatedCost: 0,
          currency: 'USD',
        }

        return {
          ...day,
          activities: [...day.activities, nextActivity],
        }
      }),
    )
  }

  const handleInviteSubmit = ({ email, role }) => {
    const nextInvitation = {
      id: `invite-${Date.now()}`,
      email,
      role,
      status: 'PENDING',
      expiresAtLabel: 'In 7 days',
    }

    setInvitations((previousInvites) => [nextInvitation, ...previousInvites])
  }

  const handleMemberRoleChange = (memberId, role) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    )
  }

  const handleMemberActiveToggle = (memberId, nextActive) => {
    setMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === memberId ? { ...member, isActive: nextActive } : member,
      ),
    )
  }

  const handleCommentSubmit = (message) => {
    const nextComment = {
      id: `comment-${Date.now()}`,
      authorName: 'You',
      body: message,
      targetLabel: 'Current context',
      createdAtLabel: 'Just now',
    }

    setComments((previousComments) => [nextComment, ...previousComments])
  }

  const handleChecklistToggle = (checklistId, itemId, nextChecked) => {
    setChecklists((previousChecklists) =>
      previousChecklists.map((checklist) => {
        if (checklist.id !== checklistId) {
          return checklist
        }

        return {
          ...checklist,
          items: checklist.items.map((item) =>
            item.id === itemId ? { ...item, isCompleted: nextChecked } : item,
          ),
        }
      }),
    )
  }

  return (
    <div className="space-y-3xl">
      <section className="rounded-2xl border border-line bg-panel p-xl shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <div className="space-y-xs">
            <Heading level={1}>Frontend Feature Scaffold</Heading>
            <Text tone="muted">
              Preview of trip planning, collaboration, organization, and analytics sections.
            </Text>
          </div>
          <span className="inline-flex items-center gap-xs rounded-full bg-primary/10 px-md py-xs text-caption font-medium text-primary">
            <SparklesIcon className="size-3.5" />
            {collaborationSummary}
          </span>
        </div>
      </section>

      <TripPlanningPanel
        trip={homePageData.tripPlanning.trip}
        days={itineraryDays}
        selectedDayId={selectedDayId}
        onDayChange={setSelectedDayId}
        onActivitiesReorder={handleActivitiesReorder}
        onAddActivity={handleAddActivity}
      />

      <CollaborationPanel
        members={members}
        invitations={invitations}
        comments={comments}
        onInviteSubmit={handleInviteSubmit}
        onMemberRoleChange={handleMemberRoleChange}
        onMemberActiveToggle={handleMemberActiveToggle}
        onCommentSubmit={handleCommentSubmit}
      />

      <OrganizationPanel
        checklists={checklists}
        attachments={homePageData.organization.attachments}
        reservations={homePageData.organization.reservations}
        expenses={homePageData.organization.expenses}
        budget={homePageData.organization.budget}
        onChecklistToggle={handleChecklistToggle}
      />

      <AnalyticsPanel
        trendTimeline={homePageData.analytics.trendTimeline}
        forecastTimeline={homePageData.analytics.forecastTimeline}
        exchangeRates={homePageData.analytics.exchangeRates}
        settlements={homePageData.analytics.settlements}
        settlementTransfers={homePageData.analytics.settlementTransfers}
        snapshots={homePageData.analytics.snapshots}
      />
    </div>
  )
}

export default HomePage
