import bg from '@/public/assets/bg.png'
import { Overlay, SignupMobile } from '@/styles/signup'
import Image from 'next/image'
import logo from '@/public/assets/newOnboardLogo.svg'
import Button from '@/components/authBtn/index'
import Link from 'next/link'
import Close from '@/public/assets/close-icon'
import { useRouter } from 'next/router'
import { useEffect, useState, useRef } from 'react'
import { BgContainer } from '@/components/onboardingBg/styles'
import { useContext } from "react";
import PhoneInput,{ formatPhoneNumber, formatPhoneNumberIntl, isValidPhoneNumber,isPossiblePhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import {BsEyeFill,BsEyeSlashFill} from 'react-icons/bs'
import { useSignup } from '@/hooks/useSignup'
import SignupContext from '@/context/signupContext'
import { useToast } from '@chakra-ui/react'

const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;
const Index = () => {
  const [isPasswordShown,setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown,setIsConfirmPasswordShown] = useState(false)
  const phoneRef = useRef()
  const [phoneState,setPhoneState] = useState(true)
  const [passwordState,setPasswordState] = useState(true)
  const passwordRef = useRef()
  const {setIsInputWithValue,email,setEmail,password,setPassword,confirmPassword,setConfirmPassword,accountName,setAccountName,phoneNumber,setPhoneNumber,} = useContext(SignupContext)
  const {signup,error,isLoading} = useSignup()
  const router = useRouter()
  const toast = useToast();

  useEffect(() => {
    router.prefetch('/signup/preference')
    if(accountName !== '' && email !== '' && password !== '' && confirmPassword !=='' && phoneNumber !==''){
      setIsInputWithValue(true)
    }else{
      setIsInputWithValue(false)
    }
  }, [router, setIsInputWithValue,accountName,email,password,confirmPassword,phoneNumber])

  

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate password strength
    let isPasswordValid = PWD_REGEX.test(password);
    if (!isPasswordValid) {
      toast({
        title: 'Password does not meet requirements',
        description: 'Password must be 8-24 characters and include uppercase, lowercase, number, and special character (!@#$%)',
        status: 'error',
        duration: 7000,
        isClosable: true,
        position: 'bottom-left',
      });
      return;
    }
  
    let isPhoneNumberValid =
      phoneNumber &&
      isPossiblePhoneNumber(phoneNumber) &&
      isValidPhoneNumber(phoneNumber) &&
      formatPhoneNumber(phoneNumber) &&
      formatPhoneNumberIntl(phoneNumber);
  
    if (isPhoneNumberValid) {
      phoneRef.current = true;
      setPhoneState(true);
    } else {
      phoneRef.current = false;
      setPhoneState(false);
      toast({
        title: 'Enter a valid phone number',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
  
    if (confirmPassword === password) {
      passwordRef.current = true;
      setPasswordState(true);
    } else {
      passwordRef.current = false;
      setPasswordState(false);
      toast({
        title: 'Password must match',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'bottom-left',
      });
    }
  
    if (passwordRef.current && phoneRef.current && isPasswordValid) {
      router.push('/signup/preference');
    }
  };
  

  return (
    <>
    <BgContainer image={bg}>
      <Overlay className='overlay'>
        <div className="close" onClick={()=>router.push('/')}>
          <Close />
        </div>
        <div className="content">
          <div className="welcome">
            <Image src={logo} alt='ad-promoter logo'/>
            <div className="welcome-text">
              <h3>Welcome to Ad-promoter!</h3>
              <p>Let’s help you get started</p>
            </div>
          </div>

          <form action="" onSubmit={handleSubmit}>
            <div className="name">
              <label htmlFor="name">Your name</label>
              <input 
                type="text" 
                id="name"
                name='name'
                value={accountName} 
                required
                autoComplete="name"
                onChange={(e)=> setAccountName(e.target.value)}
                className= 'input'
              />
            </div>
            <div className="email">
              <label htmlFor="email">Your email</label>
              <input 
                type="email" 
                id="email"
                name='email'
                required
                autoComplete="email"
                value={email}
                onChange={(e)=> setEmail(e.target.value)}
                className= 'input'
              />
            </div>
            <div className="tel">
              <label htmlFor="tel">Your Phone number</label>
              <div className="tel-input">
                <PhoneInput
                  defaultCountry="NG"
                  international
                  value={phoneNumber}
                  onChange={phoneNumber => setPhoneNumber(phoneNumber)}
                  className={phoneState ? 'input' : 'invalid'}
                />
              </div>
            </div>

            <div className="password">
              <div className="input-container">
                <div className="label">
                  <label htmlFor="password">Your password</label>
                  <div className="hide" onClick={()=>setIsPasswordShown(!isPasswordShown)}>
                    {isPasswordShown ? (
                      <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                      ):(
                      <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                    )}
                    {isPasswordShown ? (
                      <p>Hide</p>
                    ):(
                      <p>Show</p>
                    )}
                  </div>
                </div>
                <input
                  className={passwordState ? 'input' : 'invalid'}
                  type={isPasswordShown ? "text" : "password"} 
                  id="password"
                  name='password'
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e)=> setPassword(e.target.value)}
                />
                {/* <PasswordStrengthMeter /> */}
              </div>
            </div>

            <div className="password">
              <div className="input-container">
                <div className="label">
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div className="hide" onClick={()=>setIsConfirmPasswordShown(!isConfirmPasswordShown)}>
                    {isConfirmPasswordShown ? (
                      <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                      ):(
                      <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                    )}
                    {isConfirmPasswordShown ? (
                      <p>Hide</p>
                    ):(
                      <p>Show</p>
                    )}
                  </div>
                </div>
                <input
                  className={passwordState ? 'input' : 'invalid'}
                  // className= {passwordState.current ? 'input' : 'invalid'} 
                  type={isConfirmPasswordShown ? "text" : "password"}
                  // type='text' 
                  id="confirmPassword"
                  name='confirmPassword'
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e)=> setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button text='Next' />
            {error && <div>{error}</div>}
          </form>
        </div>
        <div className="login">
          <p>Already have an account? <Link href='/login'><a>Login</a></Link></p>
        </div>
      </Overlay>
    </BgContainer>
    <SignupMobile>
      <div className='logo'>
        <Image src={logo} alt='ad-promoter logo'/>
      </div>
      <div className='note'>
        <h3>Welcome to Ad-promoter!</h3>
        <p>
          Let’s help you get started
        </p>
      </div>
      <form action="" onSubmit={handleSubmit}>
        <div className="name">
          <label htmlFor="mname">Your name</label>
          <input 
            type="text" 
            id="mname"
            name='mname'
            value={accountName} 
            required
            autoComplete="name"
            onChange={(e)=> setAccountName(e.target.value)}
            className= 'input'
          />
        </div>
        <div className="email">
          <label htmlFor="memail">Your email</label>
          <input 
            type="email" 
            id="memail"
            name='memail'
            required
            autoComplete="email"
            value={email}
            onChange={(e)=> setEmail(e.target.value)}
            className= 'input'
          />
        </div>
        <div className="tel">
          <label htmlFor="tel">Your Phone number</label>
          <div className="tel-input">
            <PhoneInput
              defaultCountry="NG"
              international
              value={phoneNumber}
              onChange={phoneNumber => setPhoneNumber(phoneNumber)}
              className={phoneState ? 'input' : 'invalid'}
            />
          </div>
        </div>

        <div className="password">
          <div className="input-container">
            <div className="label">
              <label htmlFor="mpassword">Your password</label>
              <div className="hide" onClick={()=>setIsPasswordShown(!isPasswordShown)}>
                {isPasswordShown ? (
                  <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                  ):(
                  <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                )}
                {isPasswordShown ? (
                  <p>Hide</p>
                ):(
                  <p>Show</p>
                )}
              </div>
            </div>
            <input
              className={passwordState ? 'input' : 'invalid'}
              type={isPasswordShown ? "text" : "password"} 
              id="mpassword"
              name='mpassword'
              required
              autoComplete="new-password"
              value={password}
              onChange={(e)=> setPassword(e.target.value)}
            />
            {/* <PasswordStrengthMeter /> */}
          </div>
        </div>

        <div className="password">
          <div className="input-container">
            <div className="label">
              <label htmlFor="mconfirmPassword">Confirm password</label>
              <div className="hide" onClick={()=>setIsConfirmPasswordShown(!isConfirmPasswordShown)}>
                {isConfirmPasswordShown ? (
                  <BsEyeSlashFill style={{color: 'rgba(102,102,102,0.8)'}} />
                  ):(
                  <BsEyeFill style={{color: 'rgba(102,102,102,0.8)'}} />
                )}
                {isConfirmPasswordShown ? (
                  <p>Hide</p>
                ):(
                  <p>Show</p>
                )}
              </div>
            </div>
            <input
              className={passwordState ? 'input' : 'invalid'}
              // className= {passwordState.current ? 'input' : 'invalid'} 
              type={isConfirmPasswordShown ? "text" : "password"}
              // type='text' 
              id="mconfirmPassword"
              name='mconfirmPassword'
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e)=> setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
            
        <Button text='Next' />
        {error && <div>{error}</div>}
      </form>
    </SignupMobile>
    </>
  )
}

export default Index