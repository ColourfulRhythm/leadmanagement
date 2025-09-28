import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export interface Form {
  id: string;
  title: string;
  form_name?: string;
  blocks: Block[];
  questions: Question[];
  media: Media;
  form_style?: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_published: boolean;
  share_url?: string;
  responses_count?: number;
  last_response_at?: string | null;
}

export interface Block {
  id: string;
  title: string;
  isEditing?: boolean;
}

export interface Question {
  id: string;
  type: string;
  label: string;
  helpText?: string;
  required: boolean;
  isEditing?: boolean;
  options?: string[];
  blockId: string;
  conditionalLogic?: Array<{
    option: string;
    targetBlockId?: string;
    action: 'show' | 'hide' | 'jump';
  }>;
}

export interface Media {
  type: 'image' | 'video' | 'embed' | '';
  url: string;
  primaryText?: string;
  secondaryText?: string;
  description?: string;
  link?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  answers: { [questionId: string]: any };
  form_data: { [questionId: string]: any }; // Alias for answers for backwards compatibility
  submitted_at: string;
  created_at: string; // Alias for submitted_at for backwards compatibility
  ip_address?: string | undefined;
  user_agent?: string | undefined;
  session_id?: string | undefined;
  lead_score?: number;
  contact_info?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface Analytics {
  id: string;
  form_id: string;
  event_type: 'view' | 'start' | 'complete' | 'abandon';
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  metadata?: any;
}

export class FormsService {
  // Save or update a form to Firebase
  static async saveForm(formData: Partial<Form>): Promise<Form> {
    try {
      const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const formId = formData.id || uuidv4();
    
      console.log('💾 Saving form to Firebase with ID:', formId);
    console.log('💾 Form data:', formData);
    
    const form: Form = {
      id: formId,
      title: formData.title || 'Untitled Form',
        form_name: formData.form_name || formData.title || 'Untitled Form',
      blocks: formData.blocks || [],
      questions: formData.questions || [],
        media: formData.media || { type: '', url: '', primaryText: '', secondaryText: '', description: '', link: '' },
      form_style: formData.form_style || {},
        user_id: user.uid,
      created_at: formData.created_at || now,
      updated_at: now,
      is_published: formData.is_published || false,
        share_url: `${window.location.origin}/form/${formId}`,
        responses_count: 0,
        last_response_at: null
      };

      console.log('💾 Final form object for Firebase:', form);

      // Save to Firebase
      const formRef = doc(db, 'forms', formId);
      await setDoc(formRef, {
        ...form,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      console.log('✅ Form saved successfully to Firebase:', formId);
      
      // Also save to localStorage as backup
      this.saveFormToLocalStorage(form);
      
      return form;
    } catch (error) {
      console.error('❌ Error saving form to Firebase:', error);
      throw error;
    }
  }

  // Get a form by ID from Firebase (public access for sharing)
  static async getForm(formId: string): Promise<Form | null> {
    try {
      console.log('🔍 Attempting to fetch form from Firebase with ID:', formId);
      
      const formRef = doc(db, 'forms', formId);
      const formSnap = await getDoc(formRef);

      if (formSnap.exists()) {
        const formData = formSnap.data() as Form;
        console.log('✅ Form found in Firebase:', formData);
        return formData;
      } else {
        console.log('❌ Form not found in Firebase');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching form from Firebase:', error);
      return null;
    }
  }

  // Get all forms for a user
  static async getUserForms(userId: string): Promise<Form[]> {
    try {
      const formsRef = collection(db, 'forms');
      const q = query(
        formsRef, 
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const forms: Form[] = [];
      
      querySnapshot.forEach((doc) => {
        forms.push({ id: doc.id, ...doc.data() } as Form);
      });
      
      return forms;
    } catch (error) {
      console.error('❌ Error fetching user forms:', error);
      return [];
    }
  }

  // Submit a form response (lead collection)
  static async submitFormResponse(formId: string, answers: { [questionId: string]: any }): Promise<string> {
    try {
      console.log('📝 Submitting form response for form:', formId);
      console.log('📝 Answers:', answers);

      // Extract contact information for lead scoring
      const contactInfo = this.extractContactInfo(answers);
      const leadScore = this.calculateLeadScore(answers, contactInfo);

      const now = new Date().toISOString();
    const response: FormResponse = {
      id: uuidv4(),
        form_id: formId,
        answers,
        form_data: answers, // Alias for backwards compatibility
        submitted_at: now,
        created_at: now, // Alias for backwards compatibility
        ip_address: 'client-side', // In production, get from server
        user_agent: navigator.userAgent,
        session_id: sessionStorage.getItem('session_id') || 'unknown',
        lead_score: leadScore,
        contact_info: contactInfo
      };

      // Save response to Firebase
      const responseRef = await addDoc(collection(db, 'form_responses'), response);
      
      // Update form response count
      const formRef = doc(db, 'forms', formId);
      await updateDoc(formRef, {
        responses_count: serverTimestamp(),
        last_response_at: serverTimestamp()
      });

      console.log('✅ Form response submitted successfully:', responseRef.id);
      
      // Track analytics
      await this.trackEvent({
        form_id: formId,
        event_type: 'complete',
        ip_address: response.ip_address || 'unknown',
        user_agent: response.user_agent || 'unknown',
        session_id: response.session_id || 'unknown',
        metadata: { lead_score: leadScore, has_contact: !!contactInfo.email }
      });

      return responseRef.id;
    } catch (error) {
      console.error('❌ Error submitting form response:', error);
      throw error;
    }
  }

  // Track form analytics
  static async trackEvent(eventData: Omit<Analytics, 'id' | 'timestamp'>): Promise<void> {
    try {
      const analyticsData: Analytics = {
      id: uuidv4(),
        ...eventData,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'analytics'), analyticsData);
      console.log('📊 Analytics event tracked:', eventData.event_type);
    } catch (error) {
      console.warn('⚠️ Analytics tracking failed:', error);
      // Don't fail the main operation for analytics errors
    }
  }

  // Extract contact information from form answers
  private static extractContactInfo(answers: { [questionId: string]: any }): { name?: string; email?: string; phone?: string } {
    const contactInfo: { name?: string; email?: string; phone?: string } = {};
    
    Object.entries(answers).forEach(([questionId, answer]) => {
      if (typeof answer === 'string') {
        if (answer.includes('@') && answer.includes('.')) {
          contactInfo.email = answer;
        } else if (answer.match(/^[\+]?[1-9][\d]{0,15}$/)) {
          contactInfo.phone = answer;
        } else if (answer.length > 2 && answer.length < 50) {
          contactInfo.name = answer;
        }
      }
    });

    return contactInfo;
  }

  // Calculate lead score based on form answers
  private static calculateLeadScore(answers: { [questionId: string]: any }, contactInfo: { name?: string; email?: string; phone?: string }): number {
    let score = 0;
    
    // Contact information points
    if (contactInfo.email) score += 20;
    if (contactInfo.phone) score += 15;
    if (contactInfo.name) score += 10;
    
    // Answer completeness
    const totalAnswers = Object.keys(answers).length;
    if (totalAnswers > 5) score += 20;
    else if (totalAnswers > 3) score += 15;
    else if (totalAnswers > 1) score += 10;
    
    // Specific answer scoring (customize based on your forms)
    Object.values(answers).forEach(answer => {
      if (typeof answer === 'string' && answer.length > 20) score += 5;
      if (Array.isArray(answer) && answer.length > 2) score += 10;
    });
    
    return Math.min(score, 100); // Cap at 100
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
    try {
      const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

      const formRef = doc(db, 'forms', formId);
      await updateDoc(formRef, {
        is_published: isPublished,
        updated_at: serverTimestamp()
      });

      console.log(`✅ Form ${isPublished ? 'published' : 'unpublished'} successfully:`, formId);
    } catch (error) {
      console.error('❌ Error publishing form:', error);
      throw error;
    }
  }

  // Get form for editing (authenticated users only)
  static async getFormForEditing(formId: string): Promise<Form | null> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const formRef = doc(db, 'forms', formId);
      const formSnap = await getDoc(formRef);

      if (formSnap.exists()) {
        const formData = formSnap.data() as Form;
        
        // Check if user owns this form
        if (formData.user_id === user.uid) {
          console.log('✅ Form loaded for editing:', formData);
          return formData;
        } else {
          console.log('❌ User does not own this form');
          return null;
        }
      } else {
        console.log('❌ Form not found');
        return null;
      }
    } catch (error) {
      console.error('❌ Error loading form for editing:', error);
      return null;
    }
  }

  // Get form responses (for dashboard)
  static async getFormResponses(formId: string): Promise<FormResponse[]> {
    try {
      const responsesRef = collection(db, 'form_responses');
      const q = query(
        responsesRef,
        where('form_id', '==', formId),
        orderBy('submitted_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const responses: FormResponse[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        responses.push({ 
          id: doc.id, 
          ...data,
          form_data: data.answers || data.form_data, // Ensure alias exists
          created_at: data.submitted_at || data.created_at // Ensure alias exists
        } as FormResponse);
      });
      
      return responses;
    } catch (error) {
      console.error('❌ Error fetching form responses:', error);
      return [];
    }
  }

  // Get analytics summary for a form
  static async getFormAnalyticsSummary(formId: string): Promise<{
    totalViews: number;
    totalStarts: number;
    totalCompletes: number;
    totalAbandons: number;
    recentResponses: number;
  }> {
    try {
      const analyticsRef = collection(db, 'analytics');
      const q = query(
        analyticsRef,
        where('form_id', '==', formId)
      );
      
      const querySnapshot = await getDocs(q);
      const analytics = {
        totalViews: 0,
        totalStarts: 0,
        totalCompletes: 0,
        totalAbandons: 0,
        recentResponses: 0
      };
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        switch (data.event_type) {
          case 'view':
            analytics.totalViews++;
            break;
          case 'start':
            analytics.totalStarts++;
            break;
          case 'complete':
            analytics.totalCompletes++;
            break;
          case 'abandon':
            analytics.totalAbandons++;
            break;
        }
      });
      
      // Get recent responses (last 7 days)
      const responsesRef = collection(db, 'form_responses');
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 7);
      
      const responsesQuery = query(
        responsesRef,
        where('form_id', '==', formId),
        where('submitted_at', '>=', recentDate.toISOString())
      );
      
      const responsesSnapshot = await getDocs(responsesQuery);
      analytics.recentResponses = responsesSnapshot.size;
      
      return analytics;
    } catch (error) {
      console.error('❌ Error fetching analytics summary:', error);
      return {
        totalViews: 0,
        totalStarts: 0,
        totalCompletes: 0,
        totalAbandons: 0,
        recentResponses: 0
      };
    }
  }

  // LOCAL STORAGE METHODS (as backup/fallback)
  
  // Save form to localStorage
  static saveFormToLocalStorage(formData: Partial<Form>): string {
    try {
      const formId = formData.id || uuidv4();
      const forms = this.getAllFormsFromLocalStorage();
      
      const form: Form = {
        id: formId,
        title: formData.title || 'Untitled Form',
        form_name: formData.form_name || formData.title || 'Untitled Form',
        blocks: formData.blocks || [],
        questions: formData.questions || [],
        media: formData.media || { type: '', url: '', primaryText: '', secondaryText: '', description: '', link: '' },
        form_style: formData.form_style || {},
        user_id: formData.user_id || 'local',
        created_at: formData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_published: formData.is_published || false,
        share_url: `${window.location.origin}/form/${formId}`,
        responses_count: 0
      };

      // Update existing or add new
      const existingIndex = forms.findIndex(f => f.id === formId);
      if (existingIndex >= 0) {
        forms[existingIndex] = form;
      } else {
        forms.unshift(form); // Add to beginning
      }

      localStorage.setItem('adparlay_forms', JSON.stringify(forms));
      console.log('💾 Form saved to localStorage:', formId);
      return formId;
    } catch (error) {
      console.error('❌ Error saving to localStorage:', error);
      throw error;
    }
  }

  // Get form from localStorage
  static getFormFromLocalStorage(formId: string): Form | null {
    try {
      const forms = this.getAllFormsFromLocalStorage();
      const form = forms.find(f => f.id === formId);
      return form || null;
    } catch (error) {
      console.error('❌ Error reading from localStorage:', error);
      return null;
    }
  }

  // Get all forms from localStorage
  static getAllFormsFromLocalStorage(): Form[] {
    try {
      const stored = localStorage.getItem('adparlay_forms');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error reading forms from localStorage:', error);
      return [];
    }
  }

  // Delete form from localStorage
  static deleteFormFromLocalStorage(formId: string): boolean {
    try {
      const forms = this.getAllFormsFromLocalStorage();
      const filteredForms = forms.filter(f => f.id !== formId);
      localStorage.setItem('adparlay_forms', JSON.stringify(filteredForms));
      console.log('🗑️ Form deleted from localStorage:', formId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting from localStorage:', error);
      return false;
    }
  }
}
