/*
Copyright 2019-present OmiseGO Pte Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector, batch } from 'react-redux';
import { uniq, flatten, isEqual } from 'lodash';

import { selectWalletMethod } from 'selectors/setupSelector';
import { selectModalState } from 'selectors/uiSelector';
import { selectChildchainTransactions } from 'selectors/transactionSelector';

import config from 'util/config';
import useInterval from 'util/useInterval';

import {
  checkWatcherStatus,
  fetchBalances,
  fetchTransactions,
  fetchExits,
  fetchDeposits,
  getExitQueue,
  fetchFees,
  fetchGas,
  fetchEthStats,
  checkPendingDepositStatus,
  checkPendingExitStatus
} from 'actions/networkAction';

import DepositModal from 'containers/modals/deposit/DepositModal';
import TransferModal from 'containers/modals/transfer/TransferModal';
import ExitModal from 'containers/modals/exit/ExitModal';
import MergeModal from 'containers/modals/merge/MergeModal';
import LedgerConnect from 'containers/modals/ledger/LedgerConnect';
import AddTokenModal from 'containers/modals/addtoken/AddTokenModal';

//Wallet Functions
import Status from 'containers/status/Status';
import Account from 'containers/account/Account';
import Transactions from 'containers/transactions/Transactions';

//Hashcast
import Hashcast from 'containers/hashcast/Hashcast';

import MobileHeader from 'components/mobileheader/MobileHeader';
import MobileMenu from 'components/mobilemenu/MobileMenu';

import logo from 'images/hashcast.svg';
import * as styles from './Home.module.scss';

const POLL_INTERVAL = config.pollInterval * 1000;

function Home () {

  const dispatch = useDispatch();

  const [ mobileMenuOpen, setMobileMenuOpen ] = useState(false);
  
  const [ pageDisplay, setPageDisplay ] = useState("VarnaLogin");
  
  const depositModalState = useSelector(selectModalState('depositModal'));
  const beginner = useSelector(selectModalState('beginner'));
  const transferModalState = useSelector(selectModalState('transferModal'));
  const exitModalState = useSelector(selectModalState('exitModal'));
  const mergeModalState = useSelector(selectModalState('mergeModal'));
  const addTokenModalState = useSelector(selectModalState('addNewTokenModal'));
  const ledgerConnectModalState = useSelector(selectModalState('ledgerConnectModal'));

  const walletMethod = useSelector(selectWalletMethod());
  const transactions = useSelector(selectChildchainTransactions, isEqual);
  
  const transactedTokens = useMemo(() => {
    const inputs = flatten(transactions
      .filter(i => i.status !== 'Pending')
      .map(i => i.inputs)
    );
    return uniq(inputs.map(i => i.currency));
  }, [ transactions ]);

  useEffect(() => {
    const body = document.getElementsByTagName('body')[0];
    mobileMenuOpen
      ? body.style.overflow = 'hidden'
      : body.style.overflow = 'auto';
  }, [ mobileMenuOpen ]);

  useEffect(() => {
    for (const token of transactedTokens) {
      dispatch(getExitQueue(token));
    }
  }, [ dispatch, transactedTokens ]);

  // calls only on boot
  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchDeposits());
    dispatch(fetchExits());
  }, [ dispatch ]);

  useInterval(() => {
    batch(() => {
      // infura call
      dispatch(fetchEthStats());
      dispatch(checkPendingDepositStatus());
      dispatch(checkPendingExitStatus());

      // watcher only calls
      dispatch(checkWatcherStatus());
      dispatch(fetchBalances());
      dispatch(fetchTransactions());
    });
  }, POLL_INTERVAL);

  useInterval(() => {
    dispatch(fetchFees());
    dispatch(fetchGas());
  }, POLL_INTERVAL * 10);

  useEffect(() => {
    setPageDisplay("AccountNow");
  },[]);

  return (

    <>
      <DepositModal open={depositModalState} omgOnly={beginner}/>
      <TransferModal open={transferModalState} />
      <ExitModal open={exitModalState} />
      <MergeModal open={mergeModalState} />
      <AddTokenModal open={addTokenModalState} />

      <LedgerConnect
        open={walletMethod === 'browser'
          ? ledgerConnectModalState
          : false
        }
      />

      <div className={styles.Home}>
        <div className={styles.sidebar}>
          <img className={styles.logo} src={logo} alt='varna' />
          <Status />
        </div>
        <div className={styles.main}>
          <MobileHeader
            mobileMenuOpen={mobileMenuOpen}
            onHamburgerClick={()=>setMobileMenuOpen(open=>!open)}
          />
          <MobileMenu 
            mobileMenuOpen={mobileMenuOpen}
          />

{/*
The Top SubMenu Bar, non-mobile
*/}

          <div className={styles.secondtab}>
            <h2 
              className={pageDisplay === "AccountNow" ? styles.subtitletextActive : styles.subtitletext}
              onClick={()=>{setPageDisplay("AccountNow")}}
            >  
              Wallet
            </h2>
            <h2 
              className={pageDisplay === "Hashcast" ? styles.subtitletextActive : styles.subtitletext}
              onClick={()=>{setPageDisplay("Hashcast")}}
            >  
              Hashcast
            </h2>
          </div>
          {pageDisplay === "AccountNow" &&
          <>
            <Account/>
            <Transactions/>
          </>
          }
          {pageDisplay === "Hashcast" &&
            <Hashcast/>
          }
        </div>
      </div>
    </>
  );
}

export default React.memo(Home);