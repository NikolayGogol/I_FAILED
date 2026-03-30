import numeral from 'numeral'

export function formatNumber (value, format = '0,0.00', currency = '$') {
  try {
    return numeral ? `${currency}${numeral(+value).format(format)}` : value
  } catch (error) {
    console.log(error)
    return value
  }
}

export function floatNumber (value, format = '0a.0') {
  value = Number(value)
  try {
    return value >= 1000 ? `${numeral(value).format(format)}` : value
  } catch (error) {
    console.log(error)
    return value
  }
}
