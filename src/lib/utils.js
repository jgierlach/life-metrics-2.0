/**
 * @param {string} financialDataUrl
 * @returns {Promise<any | null>}
 */
export const loadFinancialData = async (financialDataUrl) => {
  try {
    const response = await fetch(financialDataUrl)
    if (!response.ok) {
      console.error(
        'Error fetching assets from google sheet:',
        response.status,
        response.statusText,
      )
      return null
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching assets from google sheet:', error)
    return null
  }
}

export const formatToPercentage = (number, decimalPlaces = 2) => {
  return (number * 100).toFixed(decimalPlaces) + '%'
}

// Helper function to check if a date is within the next 7 days
export const isWithinNext7Days = (dateString) => {
  if (!dateString) return false

  // Create date objects and reset time to midnight to ensure consistent comparison
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const in7Days = new Date()
  in7Days.setDate(now.getDate() + 7)
  in7Days.setHours(23, 59, 59, 999) // End of the 7th day

  const targetDate = new Date(dateString)
  const targetMonth = targetDate.getMonth()
  const targetDay = targetDate.getDate()

  // Create a date for this year's occurrence
  let targetThisYear = new Date(now.getFullYear(), targetMonth, targetDay)
  targetThisYear.setHours(0, 0, 0, 0)

  // If the event already passed this year, check for next year
  if (targetThisYear < now) {
    targetThisYear.setFullYear(now.getFullYear() + 1)
  }

  // Check if the target date is today or within the next 7 days
  return targetThisYear >= now && targetThisYear <= in7Days
}

export const sortBirthdaysByUpcoming = (relationships) => {
  const today = new Date()
  const currentYear = today.getFullYear()

  return relationships
    .map((person) => {
      const [year, month, day] = person.birthday.split('-')
      // Create a birthday for the current year
      let birthdayThisYear = new Date(currentYear, month - 1, day)

      // If the birthday has already passed this year, use the next year
      if (birthdayThisYear < today) {
        birthdayThisYear = new Date(currentYear + 1, month - 1, day)
      }

      return {
        ...person,
        upcomingBirthday: birthdayThisYear,
      }
    })
    .sort((a, b) => a.upcomingBirthday - b.upcomingBirthday)
}

export const convertDateForRelationshipSection = (dateStr) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // Use the Date constructor in ISO format (YYYY-MM-DD) with 'T00:00:00' to avoid timezone shifts
  const date = new Date(`${dateStr}T00:00:00Z`)
  const month = months[date.getUTCMonth()]
  const day = date.getUTCDate()

  // Determine the ordinal suffix for the day
  const suffix = (day) => {
    if (day > 3 && day < 21) return 'th' // Catch special cases for 11th, 12th, 13th
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  return `${month}, ${day}${suffix(day)}`
}

export const formatDateForTableView = (inputDate) => {
  if (!inputDate) {
    console.error('Invalid input date:', inputDate)
    return 'Invalid Date'
  }

  try {
    const date = new Date(inputDate)

    if (isNaN(date.getTime())) {
      console.error('Invalid Date object created from:', inputDate)
      return 'Invalid Date'
    }

    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')

    return `${month}/${day}/${year}`
  } catch (error) {
    console.error('Error processing date:', error)
    return 'Invalid Date'
  }
}

export const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatGraphDate = (dateString) => {
  const date = new Date(dateString + 'T00:00:00Z')

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  const month = monthNames[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'
    switch (day % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const ordinalSuffix = getOrdinalSuffix(day)

  return `${month} ${day}${ordinalSuffix}, ${year}`
}

export const filterTransactions = (bankTransactions, startDate, endDate) => {
  console.log('Start Date', startDate)
  console.log('End Date', endDate)

  const bankTransactionsWithoutCreditCardReimbursements = bankTransactions.filter(
    (transaction) =>
      !transaction.Description.includes('Payment to Chase card') &&
      !transaction.Description.includes('Payment Thank You'),
  )

  // No need for custom parseDate function, use Date constructor directly
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Adjust end date to include the full end day (2024-10-22 23:59:59)
  end.setHours(23, 59, 59, 999)

  return bankTransactionsWithoutCreditCardReimbursements.filter((transaction) => {
    const transactionDate = new Date(transaction.Date)
    return transactionDate >= start && transactionDate <= end
  })
}

export const getFirstMonthOfCurrentYear = () => {
  const now = new Date()
  const year = now.getFullYear()
  const shortYear = year % 100 // Get the last two digits of the year
  const firstDay = new Date(year, 0, 1) // Month is 0-indexed, so 0 is January
  const formattedDate = `${firstDay.getMonth() + 1}/${firstDay.getDate()}/${shortYear}`
  return formattedDate
}

export const getCurrentMonthAndYear = () => {
  const currentDate = new Date()

  const month = currentDate.getMonth() + 1 // getMonth() returns 0-11, so we add 1
  const year = currentDate.getFullYear()

  const formattedMonth = month + '/1/' + (year % 100)

  return formattedMonth
}

export const convertTextToLinks = (text) => {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g

  // Replace URLs in the text with anchor tags
  const linkedText = text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`
  })

  // Wrap the text in a paragraph tag
  return `<p>${linkedText}</p>`
}

export const formatTimestamp = (timestamp) => {
  // Create a Date object from the timestamp
  const date = new Date(timestamp)

  // Get the month, day, and year from the Date object
  // Note: getMonth() returns 0-11, so add 1 to get the correct month
  const month = (date.getMonth() + 1).toString().padStart(2, '0') // Pad with leading 0 if necessary
  const day = date.getDate().toString().padStart(2, '0') // Pad with leading 0 if necessary
  const year = date.getFullYear()

  // Format the date in mm/dd/yyyy format
  return `${month}/${day}/${year}`
}

export const findCategoryBudgetForSelectedMonth = (
  categoryName,
  categoryBudgetsForSelectedMonth,
) => {
  const categoryBudgetObject = categoryBudgetsForSelectedMonth.find(
    (category) => category.categoryName === categoryName,
  )
  if (categoryBudgetObject === undefined) {
    return 0
  }
  return categoryBudgetObject.categoryBudgetForMonth
}

export const findSelectedCategoryBudget = (
  selectedCategory,
  categoryDate,
  selectedCategoryObject,
) => {
  if (selectedCategory === '') {
    return 0
  }
  const currentYear = new Date().getFullYear()
  // Check if the category budget is the current year
  if (categoryDate.split(' ')[1] !== currentYear) {
    // Restructure the category date to be the current year so the object lookup doesn't fail
    categoryDate = `${categoryDate.split(' ')[0]} ${currentYear}`
  }
  return parseFloat(selectedCategoryObject[categoryDate].replace(/[$,]/g, ''))
}

export const findTransactionsForSelectedMonth = (transactions, selectedMonthAndYear) => {
  return transactions.filter(
    (transaction) =>
      transaction.Month === selectedMonthAndYear &&
      !transaction.Description.includes('Payment to Chase card') &&
      !transaction.Description.includes('Payment Thank You'),
  )
}

export const calculateSelectedMonthCashflow = (monthTransactions) => {
  return monthTransactions.reduce(
    (acc, transaction) => {
      const amount = parseFloat(transaction.Amount.replace(/[$,]/g, ''))
      if (amount > 0) {
        acc.cashIn += amount
      } else if (amount < 0) {
        acc.cashOut += amount
      }
      return acc
    },
    { cashIn: 0, cashOut: 0 },
  )
}

export const convertDateToFindCategoryBudget = (inputDate) => {
  // Parse the input date string
  const parts = inputDate.split('/')
  const day = parseInt(parts[1], 10)
  const month = parseInt(parts[0], 10) - 1 // Month is 0-indexed in JavaScript Date
  let year = parseInt(parts[2], 10) + 2000 // Adjust year for full year format

  const currentYear = new Date().getFullYear()
  if (year !== currentYear) {
    year = currentYear
  }

  // Create a new Date object
  const date = new Date(year, month, day)

  // Format the date
  const options = { month: 'short', year: 'numeric' }
  return date.toLocaleString('en-US', options)
}

export const generateMonthsAndYears = (transactions) => {
  return [...new Set(transactions.map((transaction) => transaction.Month))]
}

export const formatDollarValue = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(number)
}

export const abbreviateString = (str, maxLength, abbreviationSymbol = '...') => {
  if (typeof str !== 'string' || typeof maxLength !== 'number' || maxLength < 1) {
    throw new Error('Invalid inputs')
  }

  if (str.length <= maxLength) {
    return str
  }

  const abbreviationLength = abbreviationSymbol.length
  if (maxLength < abbreviationLength + 1) {
    return str.slice(0, maxLength)
  }

  return str.slice(0, maxLength - abbreviationLength) + abbreviationSymbol
}

export const convertDateString = (dateStr) => {
  // Split the date string into parts
  const parts = dateStr.split('/')

  // Extract the month and year
  const month = parseInt(parts[0], 10)
  const year = `20${parts[2]}`

  // Array of month names
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  // Convert month number to month name
  const monthName = monthNames[month - 1]

  // Return the formatted string
  return `${monthName}, ${year}`
}

export const convertDollarSignStringToNumber = (str) => {
  if (typeof str === 'number') {
    return str
  }
  return parseFloat(str.replace(/[$,]/g, ''))
}

export const csvGenerator = (totalData, actualHeaderKey, headerToShow, fileName) => {
  let data = totalData || null
  if (data == null || !data.length) {
    return null
  }
  let columnDelimiter = ','
  let lineDelimiter = '\n'
  let keys = headerToShow
  let result = ''
  result += keys.join(columnDelimiter)
  result += lineDelimiter
  data.forEach(function (item) {
    let ctr = 0
    actualHeaderKey.forEach(function (key) {
      if (ctr > 0) result += columnDelimiter
      if (Array.isArray(item[key])) {
        let arrayItem = item[key] && item[key].length > 0 ? '"' + item[key].join(',') + '"' : '-'
        result += arrayItem
      } else if (typeof item[key] == 'string') {
        let strItem = item[key] ? '"' + item[key] + '"' : '-'
        result += strItem ? strItem.replace(/\s{2,}/g, ' ') : strItem
      } else {
        let strItem = item[key] + ''
        result += strItem ? strItem.replace(/,/g, '') : strItem
      }

      ctr++
    })
    result += lineDelimiter
  })

  if (result == null) return

  var blob = new Blob([result])
  if (navigator.msSaveBlob) {
    // IE 10+
    navigator.msSaveBlob(blob, exportedFilenmae)
  } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    var hiddenElement = window.document.createElement('a')
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(result)
    hiddenElement.target = '_blank'
    hiddenElement.download = fileName
    hiddenElement.click()
  } else {
    let link = document.createElement('a')
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      var url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}

export const test = () => {
  console.log('TEST')
}
