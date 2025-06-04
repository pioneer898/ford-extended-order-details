async function waitMilliseconds(milliseconds){
  return new Promise((resolve)=>{
    setTimeout(function() {
      resolve();
    }, milliseconds);
  });
}

async function pageReady() {
  while (
    document.querySelector('.vehicle-details__section-header') == null || sessionStorage.cvot == null){
    await waitMilliseconds(250);
  }
  return;
}

class ExtendedDetails {
  targetUrl = 'https://www.ford.com/myaccount/vehicle-order-tracking/status';
  orderData;
  lastUrl;
  constructor(){
    this.poll();
  }
  async poll(){
    while(true){
      if(window.location.href == this.targetUrl && window.location.href != this.lastUrl){
        this.lastUrl = window.location.href;
        await this.init();
      } else if(window.location.href != this.targetUrl) {
        this.lastUrl = null;
      }
      await waitMilliseconds(1000);
    }
  }
  async init(){
    await pageReady();
    this.orderData = JSON.parse(sessionStorage.cvot).orderInfo;
    this.addExtendedDetails();
  };
  newHeader (label){
    let newHeader = document.createElement('h4');
    newHeader.classList.add('vehicle-details__section-header');
    newHeader.style.marginTop = '1.5rem';
    newHeader.textContent = label;
    return newHeader;
  }
  newRow (label, contents){
    let newRow = document.createElement('div');
    newRow.classList.add('vehicle-details__container-row');
  
    let newLabel = document.createElement('h5');
    newLabel.classList.add('vehicle-details__category-label');
    newLabel.textContent = label;
    newRow.appendChild(newLabel);
    
    let newContent = document.createElement('p');
    newContent.classList.add('vehicle-details__category--value');
    newContent.textContent = contents;
    newRow.appendChild(newContent);
    return newRow;
  }
  
  formatDate (dateString){
    const date = new Date(dateString);
    return dateString == ''?'--':`${String(date.getUTCMonth()+1).padStart(2,'0')}/${String(date.getUTCDate()).padStart(2,'0')}/${date.getUTCFullYear()}`;
  }
  
  formatDateTime (dateTimeString){
    const date = new Date(dateTimeString);
    return dateTimeString == ''?'--':`${String(date.getUTCMonth()+1).padStart(2,'0')}/${String(date.getUTCDate()).padStart(2,'0')}/${date.getUTCFullYear()} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
  }

  getEtaString(){
    const t = this;
    if(t.orderData.lastCompletedStatus.eta.etaStartDate == '1990-01-01'|| t.orderData.lastCompletedStatus.eta.etaStartDate == '1980-01-01'){
      return '--';
    } else {
      return `${t.formatDate(t.orderData.lastCompletedStatus.eta.etaStartDate)} - ${t.formatDate(t.orderData.lastCompletedStatus.eta.etaEndDate)} (Code ${t.orderData.lastCompletedStatus.eta.etaReasonCode})`;
    }
  }

  getDaysSinceDate(startDate,endDate){
    let diffMs = endDate - startDate;
    let diffDays =  Math.round(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  addDayCounts(){
    const t = this;
    let timelineDates = document.querySelectorAll('ul.vehicle-order-tracking__tracker--dates li');
    let isFirst = true;
    let firstDate;
    let lastDate;
    timelineDates.forEach(e=>{
      let originalString = e.innerHTML;
      let thisDate = Date.parse(originalString);
      if(isFirst){
        firstDate = thisDate;
        isFirst = false;
      } else {
        e.innerHTML = `
          <div class="date-days">
            <span>${originalString}</span>
            <span class="days-since-last">+${t.getDaysSinceDate(lastDate,thisDate)} days (${t.getDaysSinceDate(firstDate,thisDate)})</span>
          </div>
        `;
      }
      lastDate = thisDate;
    });
  }

  async addExtendedDetails(){
    const t = this;
    await pageReady();
    let ownershipLinksContainer = document.querySelector('.ownership-links-container');
    ownershipLinksContainer.parentNode.insertBefore(t.newHeader('Extended Details'),ownershipLinksContainer);
  
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Market',t.orderData.market),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Allocation Region',t.orderData.allocationRegion),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Primary Status',t.orderData.lastCompletedStatus.primaryStatus),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow(`Last Completed Status`,`${t.orderData.lastCompletedStatus.status} (${t.formatDateTime(t.orderData.lastCompletedStatus.statusDateTime)})`),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Invoice Date',t.formatDate(t.orderData.invoiceDate)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Build Week',t.formatDate(t.orderData.currentBuildWeek)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Build Date',t.formatDate(t.orderData.currentBuildDate)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Product Verification Date',t.formatDate(t.orderData.productionVerificationDate)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Transit Days',t.orderData.transitDays == ''?'--':t.orderData.transitDays),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Release Date',t.formatDate(t.orderData.releaseDate)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Shipped Date',t.formatDate(t.orderData.shippedDate)),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('ETA',t.getEtaString()),ownershipLinksContainer);
    ownershipLinksContainer.parentNode.insertBefore(t.newRow('Final Delivered Date',t.orderData.finalDeliveredDate == ''?'--':t.orderData.finalDeliveredDate),ownershipLinksContainer);

    let rows = document.getElementsByClassName("vehicle-details__container-row");
    for(let e=0;e<rows.length;e++){
      rows[e].style.gridTemplateColumns  = '14rem auto';
    };

    t.addDayCounts();
  }
};

const extenededDetails = new ExtendedDetails()