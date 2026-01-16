import PlacersNavbar from '@/components/PlacersNavbar/index'
import { StyledLayout } from '@/styles/promoterLayout.styles';
import MobilePlacersNavbar from "@/components/MobilePlacersNavbar/index"
import MobilePromoterNavbar from '@/components/MobilePromoterNavbar/index'
import { useRouter } from 'next/router';
import PromoterNavbar from '@/components/PromoterNavbar/index'
import AdminLayout from './AdminLayout';
import useAuth from '@/hooks/useAuth';
import { useEffect } from 'react';
import RequireAuth from '@/hooks/requireAuth';
const Layout = ({ children }) => {
  const router = useRouter()
  
  if (router.pathname.startsWith('/placers')) {
    return (
      <RequireAuth>
        <StyledLayout>
          <div className="desktop-nav">
            <PlacersNavbar />
          </div>
          {children}
          <div className="mobile-nav">
            <MobilePlacersNavbar />
          </div>
        </StyledLayout>
      </RequireAuth>
    );
  }else if(router.pathname.startsWith('/promoters')){
    return(
      <RequireAuth>  
        <StyledLayout>
          <div className="desktop-nav">
            <PromoterNavbar />
          </div>
          {children}
          <div className="mobile-nav">
            <MobilePromoterNavbar />
          </div>
        </StyledLayout>
      </RequireAuth>
    )
  }else if(router.pathname.startsWith('/admin')){
    return(
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    )
  }else{
    return(
      <>
        {children}
      </>
    ) 
  }
};
  
  export default Layout;
  