import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  flowId: null,
  currentStep: 1,
  totalSteps: 1,
  stepData: {},
  completedSteps: [],
  metadata: {},
}

const multiStepFormSlice = createSlice({
  name: 'multiStepForm',
  initialState,
  reducers: {
    startFormFlow: (state, action) => {
      const payload = action.payload || {}

      state.flowId = payload.flowId || null
      state.currentStep = Number(payload.currentStep || 1)
      state.totalSteps = Number(payload.totalSteps || 1)
      state.stepData = payload.stepData || {}
      state.completedSteps = Array.isArray(payload.completedSteps) ? payload.completedSteps : []
      state.metadata = payload.metadata || {}
    },

    setCurrentFormStep: (state, action) => {
      const nextStep = Number(action.payload)
      if (!Number.isFinite(nextStep) || nextStep < 1) {
        return
      }

      state.currentStep = nextStep
    },

    setFormTotalSteps: (state, action) => {
      const totalSteps = Number(action.payload)
      if (!Number.isFinite(totalSteps) || totalSteps < 1) {
        return
      }

      state.totalSteps = totalSteps
    },

    upsertStepData: (state, action) => {
      const stepId = action.payload?.stepId
      const data = action.payload?.data || {}

      if (!stepId) {
        return
      }

      state.stepData[stepId] = {
        ...(state.stepData[stepId] || {}),
        ...data,
      }
    },

    markFormStepCompleted: (state, action) => {
      const stepId = action.payload
      if (!stepId) {
        return
      }

      if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId)
      }
    },

    unmarkFormStepCompleted: (state, action) => {
      const stepId = action.payload
      state.completedSteps = state.completedSteps.filter((entry) => entry !== stepId)
    },

    setFormMetadata: (state, action) => {
      state.metadata = {
        ...state.metadata,
        ...(action.payload || {}),
      }
    },

    resetFormFlow: () => initialState,
  },
})

const selectMultiStepForm = (state) => state.multiStepForm
const selectCurrentFormStep = (state) => state.multiStepForm.currentStep
const selectFormStepData = (stepId) => (state) => state.multiStepForm.stepData[stepId] || {}

const {
  markFormStepCompleted,
  resetFormFlow,
  setCurrentFormStep,
  setFormMetadata,
  setFormTotalSteps,
  startFormFlow,
  unmarkFormStepCompleted,
  upsertStepData,
} = multiStepFormSlice.actions

export {
  markFormStepCompleted,
  multiStepFormSlice,
  resetFormFlow,
  selectCurrentFormStep,
  selectFormStepData,
  selectMultiStepForm,
  setCurrentFormStep,
  setFormMetadata,
  setFormTotalSteps,
  startFormFlow,
  unmarkFormStepCompleted,
  upsertStepData,
}
