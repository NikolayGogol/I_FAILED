import numeral from 'numeral'

export function formatNumber (value, format = '0,0.00', currency = '$') {
  try {
    return numeral ? `${currency}${numeral(+value).format(format)}` : value
  } catch (error) {
    console.log(error)
    return value
  }
}
