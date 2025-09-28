import { supabase } from '../lib/supabase';
import { Form, FormResponse, Analytics } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export class FormsService {
  // Save or update a form
  static async saveForm(formData: Partial<Form>): Promise<Form> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const formId = formData.id || uuidv4();
    
    console.log('💾 Saving form with ID:', formId);
    console.log('💾 Form data:', formData);
    
    const form: Form = {
      id: formId,
      title: formData.title || 'Untitled Form',
      form_name: formData.form_name,
      blocks: formData.blocks || [],
      questions: formData.questions || [],
      media: formData.media || {},
      form_style: formData.form_style || {},
      user_id: user.id,
      created_at: formData.created_at || now,
      updated_at: now,
      is_published: formData.is_published || false,
      share_url: formData.share_url || `${window.location.origin}/form/${formId}`
    };

    console.log('💾 Final form object:', form);

    const { data, error } = await supabase
      .from('forms')
      .upsert(form, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving form:', error);
      throw new Error(error.message);
    }
    
    console.log('✅ Form saved successfully:', data);
    return data;
  }

  // Get a form by ID (public access for sharing)
  static async getForm(formId: string): Promise<Form | null> {
    try {
      console.log('🔍 Attempting to fetch form with ID:', formId);
      console.log('🔍 Form ID type:', typeof formId);
      console.log('🔍 Form ID length:', formId.length);
      
      // Check if this is an old format form ID (form_timestamp_random)
      if (formId.startsWith('form_') && formId.includes('_')) {
        console.log('⚠️ Detected old format form ID, this form may not exist in Supabase');
        console.log('⚠️ Old format IDs are not compatible with the new system');
        
        // Try to find any form that might match (fallback)
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .limit(1)
          .single();
          
        if (error || !data) {
          console.log('❌ No forms found in database, this suggests the form was created with old system');
          return null;
        }
        
        console.log('⚠️ Found a form in database, but ID format mismatch suggests old system');
        return null;
      }
      
      // Get the form without checking is_published (RLS policies handle access control)
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(error.message);
      }
      
      console.log('✅ Form found:', data);
      console.log('✅ Form ID in database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching form:', error);
      return null;
    }
  }

  // Get a form by ID for editing (authenticated user access)
  static async getFormForEditing(formId: string): Promise<Form | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new Error(error.message);
      }
      return data;
    } catch (error) {
      console.error('Error fetching form for editing:', error);
      return null;
    }
  }

  // Get all forms for a user
  static async getUserForms(): Promise<Form[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Delete a form
  static async deleteForm(formId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  }

  // Save form response
  static async saveFormResponse(responseData: Partial<FormResponse>): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const response: FormResponse = {
      id: uuidv4(),
      form_id: responseData.form_id!,
      form_title: responseData.form_title!,
      form_data: responseData.form_data || {},
      user_id: user?.id,
      created_at: new Date().toISOString(),
      ip_address: responseData.ip_address,
      user_agent: responseData.user_agent
    };

    const { data, error } = await supabase
      .from('form_responses')
      .insert(response)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data.id;
  }

  // Get form responses for a form
  static async getFormResponses(formId: string): Promise<FormResponse[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if user owns the form
    const form = await this.getForm(formId);
    if (!form || form.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .eq('form_id', formId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Track analytics event
  static async trackEvent(eventData: Partial<Analytics>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const event: Analytics = {
      id: uuidv4(),
      form_id: eventData.form_id!,
      event_type: eventData.event_type!,
      timestamp: new Date().toISOString(),
      user_id: user?.id,
      ip_address: eventData.ip_address,
      user_agent: eventData.user_agent,
      session_id: eventData.session_id
    };

    const { error } = await supabase
      .from('analytics')
      .insert(event);

    if (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw error for analytics failures
    }
  }

  // Get analytics for a form
  static async getFormAnalytics(formId: string): Promise<Analytics[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // First check if user owns the form
    const form = await this.getForm(formId);
    if (!form || form.user_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .eq('form_id', formId)
      .order('timestamp', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // Get analytics summary for a form
  static async getFormAnalyticsSummary(formId: string): Promise<{
    totalViews: number;
    totalStarts: number;
    totalCompletes: number;
    totalAbandons: number;
    conversionRate: number;
    recentResponses: number;
  }> {
    const analytics = await this.getFormAnalytics(formId);
    const responses = await this.getFormResponses(formId);

    const totalViews = analytics.filter(a => a.event_type === 'view').length;
    const totalStarts = analytics.filter(a => a.event_type === 'start').length;
    const totalCompletes = analytics.filter(a => a.event_type === 'complete').length;
    const totalAbandons = analytics.filter(a => a.event_type === 'abandon').length;
    
    const conversionRate = totalStarts > 0 ? (totalCompletes / totalStarts) * 100 : 0;
    
    // Recent responses (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResponses = responses.filter(r => 
      new Date(r.created_at) > sevenDaysAgo
    ).length;

    return {
      totalViews,
      totalStarts,
      totalCompletes,
      totalAbandons,
      conversionRate,
      recentResponses
    };
  }

  // Generate share URL
  static generateShareUrl(formId: string): string {
    return `${window.location.origin}/form/${formId}`;
  }

  // Generate short share URL
  static generateShortShareUrl(formId: string): string {
    return `${window.location.origin}/f/${formId}`;
  }

  // Publish/unpublish a form
  static async publishForm(formId: string, isPublished: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('forms')
      .update({ 
        is_published: isPublished,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .eq('user_id', user.id);

    if (error) throw new Error(error.message);
  }
}
