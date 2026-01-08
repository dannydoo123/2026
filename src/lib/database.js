import { supabase } from '../supabaseClient'

// ============================================
// DOPAMINE FUNCTIONS
// ============================================

export async function getDopamineCategories() {
  const { data, error } = await supabase
    .from('dopamine_categories')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createDopamineCategory(category) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('dopamine_categories')
    .insert([{
      user_id: user.id,
      name: category.name,
      type: category.type,
      unit: category.unit,
      color: category.color,
      goal_type: category.goalType,
      goal_value: category.goalValue
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDopamineCategory(categoryId, updates) {
  const { data, error } = await supabase
    .from('dopamine_categories')
    .update({
      name: updates.name,
      type: updates.type,
      unit: updates.unit,
      color: updates.color,
      goal_type: updates.goalType,
      goal_value: updates.goalValue
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDopamineCategory(categoryId) {
  const { error } = await supabase
    .from('dopamine_categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
}

export async function getDopamineEntries(categoryId) {
  const { data, error } = await supabase
    .from('dopamine_entries')
    .select('*')
    .eq('category_id', categoryId)

  if (error) throw error
  return data || []
}

export async function upsertDopamineEntry(categoryId, date, value) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('dopamine_entries')
    .upsert({
      user_id: user.id,
      category_id: categoryId,
      date,
      value
    }, {
      onConflict: 'user_id,category_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDopamineEntry(categoryId, date) {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('dopamine_entries')
    .delete()
    .eq('category_id', categoryId)
    .eq('date', date)
    .eq('user_id', user.id)

  if (error) throw error
}

// ============================================
// MONEY/TRANSACTION FUNCTIONS
// ============================================

export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function createTransaction(transaction) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: user.id,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      note: transaction.note,
      date: transaction.date,
      is_recurring: transaction.isRecurring,
      recurring_day: transaction.recurringDay
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTransaction(transactionId, updates) {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      type: updates.type,
      category: updates.category,
      amount: updates.amount,
      currency: updates.currency,
      note: updates.note,
      date: updates.date,
      is_recurring: updates.isRecurring,
      recurring_day: updates.recurringDay
    })
    .eq('id', transactionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTransaction(transactionId) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (error) throw error
}

export async function getRecurringTransactions() {
  const { data, error } = await supabase
    .from('recurring_transactions')
    .select('*')

  if (error) throw error
  return data || []
}

export async function createRecurringTransaction(transaction) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('recurring_transactions')
    .insert([{
      user_id: user.id,
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      currency: transaction.currency,
      note: transaction.note,
      recurring_day: transaction.recurringDay
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecurringTransaction(id) {
  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// EXERCISE FUNCTIONS
// ============================================

export async function getExerciseDays() {
  const { data, error } = await supabase
    .from('exercise_days')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function upsertExerciseDay(date, completed = true) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('exercise_days')
    .upsert({
      user_id: user.id,
      date,
      completed
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExerciseDay(date) {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('exercise_days')
    .delete()
    .eq('date', date)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function getExerciseNotes() {
  const { data, error } = await supabase
    .from('exercise_notes')
    .select('*')

  if (error) throw error
  return data || []
}

export async function upsertExerciseNote(date, note) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!note || !note.trim()) {
    // Delete if note is empty
    const { error } = await supabase
      .from('exercise_notes')
      .delete()
      .eq('date', date)
      .eq('user_id', user.id)

    if (error) throw error
    return null
  }

  const { data, error } = await supabase
    .from('exercise_notes')
    .upsert({
      user_id: user.id,
      date,
      note: note.trim()
    }, {
      onConflict: 'user_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// HOBBY FUNCTIONS
// ============================================

export async function getHobbyCategories() {
  const { data, error } = await supabase
    .from('hobby_categories')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createHobbyCategory(category) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('hobby_categories')
    .insert([{
      user_id: user.id,
      name: category.name,
      type: category.type,
      unit: category.unit,
      color: category.color,
      goal_type: category.goalType,
      goal_value: category.goalValue || 0
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateHobbyCategory(id, updates) {
  const { data, error } = await supabase
    .from('hobby_categories')
    .update({
      name: updates.name,
      type: updates.type,
      unit: updates.unit,
      color: updates.color,
      goal_type: updates.goalType,
      goal_value: updates.goalValue || 0
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteHobbyCategory(id) {
  const { error } = await supabase
    .from('hobby_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getHobbyEntries() {
  const { data, error } = await supabase
    .from('hobby_entries')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function upsertHobbyEntry(categoryId, date, value) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('hobby_entries')
    .upsert({
      user_id: user.id,
      category_id: categoryId,
      date,
      value
    }, {
      onConflict: 'user_id,category_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteHobbyEntry(categoryId, date) {
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('hobby_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .eq('date', date)

  if (error) throw error
}

// ============================================
// ROUTINE FUNCTIONS
// ============================================

export async function getRoutines() {
  const { data, error } = await supabase
    .from('routines')
    .select('*')
    .eq('is_active', true)
    .order('time', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createRoutine(routine) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('routines')
    .insert([{
      user_id: user.id,
      time: routine.time,
      activity: routine.activity,
      is_active: true
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRoutine(routineId, updates) {
  const { data, error } = await supabase
    .from('routines')
    .update({
      time: updates.time,
      activity: updates.activity,
      is_active: updates.isActive
    })
    .eq('id', routineId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRoutine(routineId) {
  const { error } = await supabase
    .from('routines')
    .delete()
    .eq('id', routineId)

  if (error) throw error
}

export async function getRoutineCompletions(date) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)

  if (error) throw error
  return data || []
}

export async function getRoutineCompletionsRange(startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data || []
}

export async function toggleRoutineCompletion(routineId, date) {
  const { data: { user } } = await supabase.auth.getUser()

  // Check if completion exists
  const { data: existing, error: fetchError } = await supabase
    .from('routine_completions')
    .select('*')
    .eq('user_id', user.id)
    .eq('routine_id', routineId)
    .eq('date', date)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing) {
    // Delete if exists (toggle off)
    const { error: deleteError } = await supabase
      .from('routine_completions')
      .delete()
      .eq('id', existing.id)

    if (deleteError) throw deleteError
    return null
  } else {
    // Create if doesn't exist (toggle on)
    const { data, error: insertError } = await supabase
      .from('routine_completions')
      .insert([{
        user_id: user.id,
        routine_id: routineId,
        date,
        completed: true
      }])
      .select()
      .single()

    if (insertError) throw insertError
    return data
  }
}

// ============================================
// TASK FUNCTIONS
// ============================================

export async function getTasks(date) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('time', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getTasksRange(startDate, endDate) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createTask(task) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      user_id: user.id,
      date: task.date,
      time: task.time,
      title: task.title,
      description: task.description || '',
      completed: false
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update({
      date: updates.date,
      time: updates.time,
      title: updates.title,
      description: updates.description,
      completed: updates.completed
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)

  if (error) throw error
}

export async function toggleTaskCompletion(taskId) {
  // Get current task
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('completed')
    .eq('id', taskId)
    .single()

  if (fetchError) throw fetchError

  // Toggle completion
  const { data, error } = await supabase
    .from('tasks')
    .update({ completed: !task.completed })
    .eq('id', taskId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// USER SETTINGS FUNCTIONS
// ============================================

export async function getUserSettings() {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data
}

export async function updateUserSettings(settings) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings
    })
    .select()
    .single()

  if (error) throw error
  return data
}
