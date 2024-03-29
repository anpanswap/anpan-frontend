import { useCallback } from 'react'
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core'
import { NoBscProviderError } from '@binance-chain/bsc-connector'
import {
  NoEthereumProviderError,
  UserRejectedRequestError as UserRejectedRequestErrorInjected,
} from '@web3-react/injected-connector'
import {
  UserRejectedRequestError as UserRejectedRequestErrorWalletConnect,
  WalletConnectConnector,
} from '@web3-react/walletconnect-connector'
import { ConnectorNames, connectorLocalStorageKey } from '@anpanswap/uikit'
import { connectorsByName } from 'utils/web3React'
import { setupNetwork } from 'utils/wallet'
import useToast from 'hooks/useToast'
import { profileClear } from 'state/profile'
import { useAppDispatch } from 'state'
import { useTranslation } from 'contexts/Localization'
import { ethers } from "ethers";
import Web3 from 'web3';

const useAuth = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { activate, deactivate } = useWeb3React()
  const { toastError } = useToast()

  const login = useCallback(
    (connectorID: ConnectorNames) => {
      const connector = connectorsByName[connectorID]
      if (connector) {
              
        let web3=null; // Will hold the web3 instance

        const handleAuthenticate = ({
          account,
          signature,
        }: {
          account: string;
          signature: string;
        }) =>
          fetch(`${process.env.REACT_APP_BACKEND_URL}/auth`, {
            body: JSON.stringify({ account, signature }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          }).then((response) => response.json());
        
        const handleSignMessage = async ({
          account,
          nonce,
        }: {
          account: string;
          nonce: string;
        }) => {
          try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new ethers.providers.Web3Provider(window.ethereum)
              const signer = provider.getSigner();
              const signature = await signer.signMessage(`I am signing my one-time nonce: ${nonce}`);
        
            return { account, signature };
          } catch (err) {
            throw new Error(
              'You need to sign the message to be able to log in.'
            );
          }
        };
        
        const handleSignup = (account: string) =>
          fetch(`${process.env.REACT_APP_BACKEND_URL}/users`, {
            body: JSON.stringify({ account }),
            headers: {
              'Content-Type': 'application/json',
            },
            method: 'POST',
          }).then((response) => response.json());
        
        const handleClick = async () => {
          // Check if MetaMask is installed
          if (!(window as any).ethereum) {
          window.alert('Please install MetaMask first.');
          return;
          }

          if (!web3) {
            try {
            // Request account access if needed
            await (window as any).ethereum.enable();

            // We don't know window.web3 version, so we use our own instance of Web3
            // with the injected provider given by MetaMask
            web3 = new Web3((window as any).ethereum);
            } catch (error) {
              window.alert('You need to allow MetaMask.');
              return;
              }
            }
          const coinbase = await web3.eth.getCoinbase();
          if (!coinbase) {
            window.alert('Please activate MetaMask first.');
          return;}
          const account = coinbase.toLowerCase();
            // Look if user with current account is already present on backend
            fetch(
              `${process.env.REACT_APP_BACKEND_URL}/users?account=${account}`
            )
              .then((response) => response.json())
              // If yes, retrieve it. If no, create it.
              .then((users) =>
                users.length ? users[0] : handleSignup(account)
              )
              // Popup MetaMask confirmation modal to sign message
              .then(handleSignMessage)
              // Send signature to backend on the /auth route
              .then(handleAuthenticate)
              // Pass accessToken back to parent component (to save it in localStorage)
        
              activate(connector, async (error: Error) => {
                if (error instanceof UnsupportedChainIdError) {
                  const hasSetup = await setupNetwork()
                  if (hasSetup) {
                    activate(connector)
                  }
                } else {
                  window.localStorage.removeItem(connectorLocalStorageKey)
                  if (error instanceof NoEthereumProviderError || error instanceof NoBscProviderError) {
                    toastError(t('Provider Error'), t('No provider was found'))
                  } else if (
                    error instanceof UserRejectedRequestErrorInjected ||
                    error instanceof UserRejectedRequestErrorWalletConnect
                  ) {
                    if (connector instanceof WalletConnectConnector) {
                      const walletConnector = connector as WalletConnectConnector
                      walletConnector.walletConnectProvider = null
                    }
                    toastError(t('Authorization Error'), t('Please authorize to access your account'))
                  } else {
                    toastError(error.name, error.message)
                  }
                }
              })  

              .catch((err) => {
                window.alert(err);
              });
          };
        handleClick()

     
      } else {
        toastError(t('Unable to find connector'), t('The connector config is wrong'))
      }



    },
    [t, activate, toastError],
  )
  
  const logout = useCallback(() => {
    dispatch(profileClear())
    deactivate()
    // This localStorage key is set by @web3-react/walletconnect-connector
    if (window.localStorage.getItem('walletconnect')) {
      connectorsByName.walletconnect.close()
      connectorsByName.walletconnect.walletConnectProvider = null
    }
  }, [deactivate, dispatch])

  return { login, logout }
}

export default useAuth
